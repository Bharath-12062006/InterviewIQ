"""Configurable async LLM client for Ollama (local), Gemini, and OpenAI.

All credentials and local model settings stay strictly server-side in environment
variables. Every response is requested in JSON mode, parsed safely (stripping any
model reasoning tags or markdown fences), and errors/timeouts raise explicit exceptions.
"""

import asyncio
import json
import logging
import re
from typing import Optional

import httpx

from ..config import settings

logger = logging.getLogger(__name__)
MAX_TRANSIENT_RETRIES = 3
MAX_WAIT_PER_RETRY_SECONDS = 15.0
_OLLAMA_LOCK: Optional[asyncio.Lock] = None


def _get_ollama_lock() -> asyncio.Lock:
    global _OLLAMA_LOCK
    if _OLLAMA_LOCK is None:
        _OLLAMA_LOCK = asyncio.Lock()
    return _OLLAMA_LOCK


class LLMConfigError(RuntimeError):
    """Raised when the configured LLM provider is missing required configuration."""


class LLMUpstreamError(RuntimeError):
    """Raised when the upstream LLM request times out, fails, or returns invalid JSON."""

    def __init__(self, message: str, status_code: int = 502):
        super().__init__(message)
        self.status_code = status_code


def _strip_json_fences(raw: str) -> str:
    text = (raw or "").strip()
    # Strip Qwen3/reasoning <think>...</think> tags safely before extracting JSON
    text = re.sub(r"<think>[\s\S]*?</think>", "", text, flags=re.IGNORECASE).strip()
    if text.startswith("```"):
        text = re.sub(r"^```(?:json)?\s*", "", text, flags=re.IGNORECASE)
        text = re.sub(r"\s*```$", "", text)
    return text.strip()


def _parse_json_payload(raw_text: str) -> dict:
    cleaned = _strip_json_fences(raw_text)
    try:
        data = json.loads(cleaned)
        if not isinstance(data, dict):
            raise ValueError("LLM response root must be a JSON object.")
        return data
    except Exception as exc:
        # Attempt to salvage first JSON object block if trailing text appeared
        match = re.search(r"\{[\s\S]*\}", cleaned)
        if match:
            try:
                data = json.loads(match.group(0))
                if isinstance(data, dict):
                    return data
            except Exception:
                pass
        raise LLMUpstreamError(f"LLM returned malformed JSON: {exc}", status_code=502) from exc


def _parse_retry_delay_seconds(raw_delay: Optional[str], retry_after_header: Optional[str] = None) -> Optional[float]:
    for candidate in (raw_delay, retry_after_header):
        if not candidate:
            continue
        text = str(candidate).strip()
        if text.endswith("ms"):
            try:
                return max(0.0, float(text[:-2]) / 1000.0)
            except ValueError:
                pass
        if text.endswith("s"):
            try:
                return max(0.0, float(text[:-1]))
            except ValueError:
                pass
        try:
            return max(0.0, float(text))
        except ValueError:
            continue
    return None


def _format_duration_human(seconds: Optional[float]) -> str:
    if seconds is None:
        return "shortly"
    total = max(1, int(round(seconds)))
    hours, rem = divmod(total, 3600)
    mins, secs = divmod(rem, 60)
    if hours > 0:
        return f"{hours}h {mins}m"
    if mins > 0:
        return f"{mins}m {secs}s"
    return f"{secs}s"


def _extract_gemini_error_info(resp: httpx.Response) -> dict:
    """Safely extract Google RPC error fields without logging or leaking secrets."""
    raw_msg = ""
    rpc_status = ""
    details = []
    try:
        err_obj = resp.json().get("error", {})
        raw_msg = str(err_obj.get("message") or "")
        rpc_status = str(err_obj.get("status") or "")
        details = err_obj.get("details") or []
    except Exception:
        raw_msg = resp.text[:300]

    quota_metric = ""
    quota_id = ""
    quota_value = ""
    quota_desc = ""
    quota_model = ""
    retry_delay_raw = ""

    for item in details:
        if not isinstance(item, dict):
            continue
        type_str = str(item.get("@type") or "")
        if type_str.endswith("QuotaFailure"):
            violations = item.get("violations") or []
            if violations and isinstance(violations[0], dict):
                v = violations[0]
                quota_metric = str(v.get("quotaMetric") or "")
                quota_id = str(v.get("quotaId") or "")
                quota_value = str(v.get("quotaValue") or "")
                quota_desc = str(v.get("description") or "")
                dims = v.get("quotaDimensions") or {}
                if isinstance(dims, dict):
                    quota_model = str(dims.get("model") or "")
        elif type_str.endswith("RetryInfo"):
            retry_delay_raw = str(item.get("retryDelay") or "")

    retry_seconds = _parse_retry_delay_seconds(retry_delay_raw, resp.headers.get("retry-after"))
    combined_low = f"{raw_msg} {quota_desc} {quota_id} {quota_metric}".lower()

    is_billing = (
        "billing" in combined_low
        or "payment" in combined_low
        or "enable billing" in combined_low
        or (quota_value == "0" and ("free_tier" in combined_low or "limit: 0" in combined_low))
    )
    is_daily = (
        "perday" in quota_id.lower()
        or "requestsperday" in quota_id.lower()
        or "per day" in combined_low
        or "daily" in combined_low
        or (retry_seconds is not None and retry_seconds >= 60.0)
    )
    is_tpm = "token" in quota_id.lower() or "token" in quota_metric.lower()

    if is_billing:
        reason = "billing_or_quota_restriction"
        non_retryable = True
        user_msg = (
            f"Gemini API billing or quota restriction ({quota_id or rpc_status or 'QUOTA_ZERO'}). "
            f"{quota_desc or 'Check plan, billing, or Free Tier eligibility in Google AI Studio.'}"
        )
    elif is_daily:
        reason = "daily_quota_exceeded"
        non_retryable = True
        limit_str = f"{quota_value}/day" if quota_value else "daily limit"
        model_str = quota_model or settings.gemini_model
        retry_hint = (
            f"Retry in ~{_format_duration_human(retry_seconds)}"
            if retry_seconds
            else "Retry after daily reset"
        )
        user_msg = (
            f"Gemini daily request quota exceeded ({limit_str} for {model_str}; "
            f"quotaId: {quota_id or 'PerDay'}). {retry_hint} or enable billing / upgrade plan in Google AI Studio."
        )
    elif is_tpm:
        reason = "tokens_per_minute_exceeded"
        non_retryable = False
        wait_hint = f"Wait ~{_format_duration_human(retry_seconds)} and retry." if retry_seconds else "Retry shortly."
        user_msg = (
            f"Gemini token-per-minute rate limit reached ({quota_id or quota_metric or 'TPM'}, "
            f"limit: {quota_value or 'N/A'}). {wait_hint}"
        )
    else:
        reason = "requests_per_minute_exceeded"
        non_retryable = False
        wait_hint = f"Wait ~{_format_duration_human(retry_seconds)} and retry." if retry_seconds else "Retry shortly."
        user_msg = (
            f"Gemini per-minute rate limit exceeded ({quota_id or quota_metric or 'RPM'}, "
            f"limit: {quota_value or 'N/A'}). {wait_hint}"
        )

    return {
        "status": resp.status_code,
        "rpcStatus": rpc_status,
        "reason": reason,
        "nonRetryable": non_retryable,
        "quotaMetric": quota_metric,
        "quotaId": quota_id,
        "quotaValue": quota_value,
        "retryDelaySeconds": retry_seconds,
        "message": user_msg,
    }


async def _call_gemini(system_prompt: str, user_prompt: str, temperature: float) -> dict:
    api_key = settings.gemini_api_key
    if not api_key:
        raise LLMConfigError(
            "Gemini API key (GEMINI_API_KEY) is not configured in ai-service/.env. "
            "Set GEMINI_API_KEY (or set LLM_PROVIDER=openai with OPENAI_API_KEY) to run the AI interviewer."
        )

    primary_model = settings.gemini_model
    alias_fallbacks = [primary_model]
    for fallback_model in ("gemini-3.6-flash", "gemini-3.5-flash", "gemini-3.8-flash", "gemini-3-flash-preview"):
        if fallback_model not in alias_fallbacks:
            alias_fallbacks.append(fallback_model)

    payload = {
        "system_instruction": {"parts": [{"text": system_prompt}]},
        "contents": [{"role": "user", "parts": [{"text": user_prompt}]}],
        "generationConfig": {
            "temperature": temperature,
            "responseMimeType": "application/json",
        },
    }
    headers = {
        "Content-Type": "application/json",
        "x-goog-api-key": api_key,
    }

    timeout = httpx.Timeout(settings.llm_timeout_seconds, connect=10.0)
    resp = None
    last_detail = ""
    last_status = 502
    model_idx = 0
    transient_retries = 0

    try:
        async with httpx.AsyncClient(timeout=timeout) as client:
            while True:
                model = alias_fallbacks[model_idx]
                url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"
                resp = await client.post(url, headers=headers, json=payload)

                if resp.status_code < 400:
                    break

                if resp.status_code in (401, 403):
                    raise LLMUpstreamError("Gemini API authentication failed. Verify GEMINI_API_KEY.", status_code=502)

                if resp.status_code == 429:
                    info = _extract_gemini_error_info(resp)
                    logger.warning(
                        "Gemini 429 (%s) model=%s quotaId=%s quotaValue=%s retryDelay=%ss nonRetryable=%s",
                        info["reason"],
                        model,
                        info["quotaId"],
                        info["quotaValue"],
                        info["retryDelaySeconds"],
                        info["nonRetryable"],
                    )
                    # Never wastefully retry daily quota exhaustion or billing restrictions
                    if info["nonRetryable"] or transient_retries >= MAX_TRANSIENT_RETRIES:
                        raise LLMUpstreamError(info["message"], status_code=429)

                    retry_sec = info["retryDelaySeconds"]
                    if retry_sec is not None and retry_sec > MAX_WAIT_PER_RETRY_SECONDS:
                        raise LLMUpstreamError(info["message"], status_code=429)

                    backoff = 1.5 * (2 ** transient_retries)
                    wait_s = min(MAX_WAIT_PER_RETRY_SECONDS, max(backoff, retry_sec or 0.0))
                    transient_retries += 1
                    logger.info("Retrying transient Gemini 429 (%d/%d) after %.2fs", transient_retries, MAX_TRANSIENT_RETRIES, wait_s)
                    await asyncio.sleep(wait_s)
                    continue

                try:
                    last_detail = resp.json().get("error", {}).get("message", "")
                except Exception:
                    last_detail = resp.text[:200]
                last_status = resp.status_code

                # Retired/deprecated model alias (404): switch once without billing retry waste
                if resp.status_code == 404 and model_idx < len(alias_fallbacks) - 1:
                    model_idx += 1
                    continue

                # Temporary capacity spike (503): exponential backoff up to MAX_TRANSIENT_RETRIES, then fallback alias if any
                if resp.status_code == 503:
                    if transient_retries < MAX_TRANSIENT_RETRIES:
                        backoff = min(MAX_WAIT_PER_RETRY_SECONDS, 1.5 * (2 ** transient_retries))
                        transient_retries += 1
                        logger.warning("Gemini 503 capacity spike on %s; retry %d/%d after %.2fs", model, transient_retries, MAX_TRANSIENT_RETRIES, backoff)
                        await asyncio.sleep(backoff)
                        continue
                    if model_idx < len(alias_fallbacks) - 1:
                        model_idx += 1
                        transient_retries = 0
                        continue

                raise LLMUpstreamError(
                    f"Gemini API error ({resp.status_code}): {last_detail}",
                    status_code=502,
                )
    except httpx.TimeoutException as exc:
        raise LLMUpstreamError(
            f"Gemini API request timed out after {settings.llm_timeout_seconds}s.",
            status_code=504,
        ) from exc
    except httpx.HTTPError as exc:
        raise LLMUpstreamError(f"Failed to reach Gemini API: {exc}", status_code=502) from exc

    if resp is None or resp.status_code >= 400:
        raise LLMUpstreamError(
            f"Gemini API error ({last_status}): {last_detail or 'Unavailable'}",
            status_code=502,
        )

    body = resp.json()
    candidates = body.get("candidates") or []
    if not candidates:
        raise LLMUpstreamError("Gemini API returned no candidate responses.", status_code=502)

    parts = candidates[0].get("content", {}).get("parts") or []
    text_chunks = [
        p.get("text", "")
        for p in parts
        if isinstance(p, dict) and p.get("text") and not p.get("thought")
    ]
    if not text_chunks:
        raise LLMUpstreamError("Gemini API returned an empty response.", status_code=502)

    return _parse_json_payload("\n".join(text_chunks))


async def _call_openai(system_prompt: str, user_prompt: str, temperature: float) -> dict:
    api_key = settings.openai_api_key
    if not api_key:
        raise LLMConfigError(
            "OpenAI API key (OPENAI_API_KEY) is not configured in ai-service/.env. "
            "Set OPENAI_API_KEY or switch LLM_PROVIDER=gemini with GEMINI_API_KEY."
        )

    url = "https://api.openai.com/v1/chat/completions"
    payload = {
        "model": settings.openai_model,
        "temperature": temperature,
        "response_format": {"type": "json_object"},
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
    }
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {api_key}",
    }

    timeout = httpx.Timeout(settings.llm_timeout_seconds, connect=10.0)
    try:
        async with httpx.AsyncClient(timeout=timeout) as client:
            resp = await client.post(url, headers=headers, json=payload)
    except httpx.TimeoutException as exc:
        raise LLMUpstreamError(
            f"OpenAI API request timed out after {settings.llm_timeout_seconds}s.",
            status_code=504,
        ) from exc
    except httpx.HTTPError as exc:
        raise LLMUpstreamError(f"Failed to reach OpenAI API: {exc}", status_code=502) from exc

    if resp.status_code == 401:
        raise LLMUpstreamError("OpenAI API authentication failed. Verify OPENAI_API_KEY.", status_code=502)
    if resp.status_code == 429:
        raise LLMUpstreamError("OpenAI API rate limit or quota exceeded. Please retry shortly.", status_code=429)
    if resp.status_code >= 400:
        detail = ""
        try:
            detail = resp.json().get("error", {}).get("message", "")
        except Exception:
            detail = resp.text[:200]
        raise LLMUpstreamError(f"OpenAI API error ({resp.status_code}): {detail}", status_code=502)

    body = resp.json()
    choices = body.get("choices") or []
    if not choices:
        raise LLMUpstreamError("OpenAI API returned no choices.", status_code=502)

    content = choices[0].get("message", {}).get("content", "")
    if not content:
        raise LLMUpstreamError("OpenAI API returned empty content.", status_code=502)

    return _parse_json_payload(content)


def _fast_local_ollama_url(base_url: str) -> str:
    """Avoid Windows ~2s IPv6 [::1] connect delay when probing localhost."""
    return re.sub(r"^(https?://)localhost(?=[:/]|$)", r"\g<1>127.0.0.1", base_url.rstrip("/"), flags=re.IGNORECASE)


async def check_llm_health() -> dict:
    """Verify live provider connection (especially local Ollama) without exposing credentials."""
    from ..config import get_llm_status

    provider = settings.llm_provider
    if provider != "ollama":
        return get_llm_status()

    base_url = settings.ollama_base_url
    probe_url = _fast_local_ollama_url(base_url)
    target_model = settings.ollama_model
    status = {
        "provider": "ollama",
        "model": target_model,
        "configured": False,
        "providerAvailable": False,
        "modelAvailable": False,
        "connectionStatus": "unreachable",
        "allowNlpFallback": settings.allow_nlp_fallback,
        "timeoutSeconds": settings.ollama_timeout_seconds,
    }

    try:
        async with httpx.AsyncClient(timeout=httpx.Timeout(1.5, connect=0.8)) as client:
            resp = await client.get(f"{probe_url}/api/tags")
    except Exception:
        status["detail"] = f"Ollama service is unreachable at {base_url}. Run Ollama locally."
        return status

    if resp.status_code >= 400:
        status["connectionStatus"] = f"error_{resp.status_code}"
        status["detail"] = f"Ollama health probe returned HTTP {resp.status_code}."
        return status

    status["providerAvailable"] = True
    try:
        tags_data = resp.json()
        installed = [
            str(m.get("name") or "")
            for m in (tags_data.get("models") or [])
            if isinstance(m, dict)
        ]
    except Exception:
        installed = []

    target_low = target_model.lower()
    model_found = any(
        name.lower() == target_low or name.lower().startswith(f"{target_low}-")
        for name in installed
    )
    status["modelAvailable"] = model_found
    if model_found:
        status["configured"] = True
        status["connectionStatus"] = "connected"
    else:
        status["connectionStatus"] = "model_not_found"
        status["detail"] = f"Ollama is running, but model '{target_model}' is not pulled yet. Run: ollama pull {target_model}"

    return status


async def _call_ollama(system_prompt: str, user_prompt: str, temperature: float) -> dict:
    base_url = settings.ollama_base_url
    connect_url = _fast_local_ollama_url(base_url)
    model = settings.ollama_model
    url = f"{connect_url}/api/chat"
    payload = {
        "model": model,
        "stream": False,
        "format": "json",
        "think": settings.ollama_think,
        "keep_alive": settings.ollama_keep_alive,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        "options": {
            "temperature": max(0.55, float(temperature)),
            "top_p": 0.8,
            "top_k": 20,
            "repeat_penalty": 1.15,
            "num_ctx": settings.ollama_num_ctx,
            "num_predict": settings.ollama_num_predict,
        },
    }

    timeout = httpx.Timeout(settings.ollama_timeout_seconds, connect=2.5)
    # Serialize local Ollama calls so 16GB CPU/iGPU hosts never load or thrash concurrent inferences
    async with _get_ollama_lock():
        try:
            async with httpx.AsyncClient(timeout=timeout) as client:
                resp = await client.post(url, json=payload)
        except httpx.TimeoutException as exc:
            raise LLMUpstreamError(
                f"Local Ollama ({model}) timed out after {settings.ollama_timeout_seconds}s.",
                status_code=504,
            ) from exc
        except httpx.ConnectError as exc:
            raise LLMUpstreamError(
                f"Local Ollama service is unavailable at {base_url}. Ensure Ollama is running (`ollama serve`) and model `{model}` is pulled.",
                status_code=503,
            ) from exc
        except httpx.HTTPError as exc:
            raise LLMUpstreamError(f"Failed to communicate with local Ollama: {exc}", status_code=502) from exc

    if resp.status_code == 404:
        raise LLMUpstreamError(
            f"Ollama model '{model}' is not available locally. Run: ollama pull {model}",
            status_code=503,
        )
    if resp.status_code >= 400:
        detail = ""
        try:
            detail = str(resp.json().get("error") or "")
        except Exception:
            detail = resp.text[:200]
        raise LLMUpstreamError(f"Ollama error ({resp.status_code}): {detail}", status_code=502)

    body = resp.json()
    content = (body.get("message") or {}).get("content") or body.get("response") or ""
    if not str(content).strip():
        raise LLMUpstreamError("Local Ollama returned an empty response.", status_code=502)

    return _parse_json_payload(str(content))


async def generate_structured_json(system_prompt: str, user_prompt: str, temperature: float = 0.35) -> dict:
    """Invoke the configured LLM provider and return validated JSON dict."""
    provider = settings.llm_provider
    if provider == "ollama":
        return await _call_ollama(system_prompt, user_prompt, temperature)
    if provider == "openai":
        return await _call_openai(system_prompt, user_prompt, temperature)
    if provider == "gemini":
        return await _call_gemini(system_prompt, user_prompt, temperature)
    raise LLMConfigError(f"Unsupported LLM_PROVIDER '{provider}'. Choose 'ollama', 'gemini', or 'openai'.")
