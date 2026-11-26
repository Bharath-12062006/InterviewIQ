// Verified General Aptitude + Verbal & Reasoning practice questions mapped by conceptId

export const GENERAL_AND_VERBAL_QUESTIONS = {
  trains: [
    {
      id: 'tr-1',
      question: 'A train 120 m long is running at a speed of 54 km/hr. How much time will it take to pass a telegraph pole?',
      options: ['6 seconds', '8 seconds', '10 seconds', '12 seconds'],
      answerIndex: 1,
      explanation: 'Speed = 54 * (5/18) = 15 m/s. Time to pass pole = Distance / Speed = 120 / 15 = 8 seconds.',
    },
    {
      id: 'tr-2',
      question: 'A 150 m long train crosses a 250 m long platform in 20 seconds. What is the speed of the train in km/hr?',
      options: ['60 km/hr', '68 km/hr', '72 km/hr', '80 km/hr'],
      answerIndex: 2,
      explanation: 'Total distance = 150 + 250 = 400 m. Speed = 400 / 20 = 20 m/s = 20 * (18/5) = 72 km/hr.',
    },
    {
      id: 'tr-3',
      question: 'Two trains 140 m and 160 m long run on parallel tracks in opposite directions at 60 km/hr and 48 km/hr. How long will they take to clear each other?',
      options: ['8 seconds', '10 seconds', '12 seconds', '15 seconds'],
      answerIndex: 1,
      explanation: 'Relative speed = 60 + 48 = 108 km/hr = 108 * (5/18) = 30 m/s. Total distance = 140 + 160 = 300 m. Time = 300 / 30 = 10 seconds.',
    },
  ],
  'time-distance': [
    {
      id: 'td-1',
      question: 'A car travels from A to B at 40 km/hr and returns from B to A at 60 km/hr. What is the average speed for the entire journey?',
      options: ['48 km/hr', '50 km/hr', '52 km/hr', '45 km/hr'],
      answerIndex: 0,
      explanation: 'Average speed for equal distances = 2xy / (x + y) = (2 * 40 * 60) / (40 + 60) = 4800 / 100 = 48 km/hr.',
    },
    {
      id: 'td-2',
      question: 'Walking at 3/4 of his usual speed, a person reaches his office 15 minutes late. What is his usual time to cover the distance?',
      options: ['30 mins', '45 mins', '60 mins', '40 mins'],
      answerIndex: 1,
      explanation: 'If speed becomes 3/4, time becomes 4/3 of usual time T. So (4/3)T - T = 15 => T/3 = 15 => T = 45 minutes.',
    },
  ],
  'time-work': [
    {
      id: 'tw-1',
      question: 'A can finish a piece of work in 12 days and B can finish it in 15 days. Working together, in how many days will they complete it?',
      options: ['6 2/3 days', '7 days', '6 days', '5 1/2 days'],
      answerIndex: 0,
      explanation: 'Combined time = (12 * 15) / (12 + 15) = 180 / 27 = 20 / 3 = 6 2/3 days.',
    },
    {
      id: 'tw-2',
      question: 'A is twice as efficient as B. Together they finish a job in 14 days. How many days would A alone take?',
      options: ['21 days', '28 days', '18 days', '42 days'],
      answerIndex: 0,
      explanation: 'Let B take 2x days and A take x days. 1/x + 1/(2x) = 1/14 => 3/(2x) = 1/14 => x = 21 days.',
    },
  ],
  'pipes-cistern': [
    {
      id: 'pc-1',
      question: 'Pipe A can fill a tank in 10 hours and Pipe B can empty the full tank in 15 hours. If both are opened together, in how many hours will the tank be full?',
      options: ['25 hours', '30 hours', '20 hours', '12 hours'],
      answerIndex: 1,
      explanation: 'Net rate per hour = 1/10 - 1/15 = (3 - 2) / 30 = 1/30. Hence 30 hours.',
    },
    {
      id: 'pc-2',
      question: 'Two pipes fill a cistern in 20 minutes and 30 minutes respectively, while a waste pipe empties it in 40 minutes. If all three are opened, how long to fill the cistern?',
      options: ['17 1/7 mins', '15 mins', '18 2/7 mins', '16 mins'],
      answerIndex: 0,
      explanation: 'Net rate = 1/20 + 1/30 - 1/40 = (6 + 4 - 3) / 120 = 7/120. Time = 120 / 7 = 17 1/7 minutes.',
    },
  ],
  interest: [
    {
      id: 'in-1',
      question: 'What is the difference between Compound Interest and Simple Interest on Rs. 10,000 at 10% per annum for 2 years?',
      options: ['Rs. 50', 'Rs. 100', 'Rs. 150', 'Rs. 200'],
      answerIndex: 1,
      explanation: 'For 2 years, CI - SI = P * (R/100)^2 = 10000 * (10/100)^2 = 10000 * 0.01 = Rs. 100.',
    },
    {
      id: 'in-2',
      question: 'A sum of money doubles itself in 8 years at simple interest. What is the annual rate of interest?',
      options: ['10%', '12.5%', '15%', '8%'],
      answerIndex: 1,
      explanation: 'If sum doubles, SI = P. So P = (P * R * 8) / 100 => R = 100 / 8 = 12.5%.',
    },
  ],
  'profit-loss': [
    {
      id: 'pl-1',
      question: 'An item bought for Rs. 800 is sold for Rs. 920. What is the profit percentage?',
      options: ['12%', '15%', '16%', '18%'],
      answerIndex: 1,
      explanation: 'Profit = 920 - 800 = 120. Profit% = (120 / 800) * 100 = 15%.',
    },
    {
      id: 'pl-2',
      question: 'What single discount is equivalent to two successive discounts of 20% and 10%?',
      options: ['30%', '28%', '25%', '29%'],
      answerIndex: 1,
      explanation: 'Equivalent discount = 20 + 10 - (20 * 10)/100 = 30 - 2 = 28%.',
    },
  ],
  percentage: [
    {
      id: 'pe-1',
      question: 'If the price of sugar increases by 25%, by what percentage should a family reduce its consumption so that expenditure remains unchanged?',
      options: ['25%', '20%', '15%', '18%'],
      answerIndex: 1,
      explanation: 'Reduction% = [25 / (100 + 25)] * 100 = (25 / 125) * 100 = 20%.',
    },
    {
      id: 'pe-2',
      question: 'In an exam, 35% marks are required to pass. A student gets 175 marks and fails by 35 marks. What are the maximum marks?',
      options: ['500', '600', '700', '550'],
      answerIndex: 1,
      explanation: 'Passing marks = 175 + 35 = 210. Since 35% of M = 210, M = (210 * 100) / 35 = 600.',
    },
  ],
  'ratio-proportion': [
    {
      id: 'rp-1',
      question: 'If A : B = 2 : 3 and B : C = 4 : 5, what is A : B : C?',
      options: ['8 : 12 : 15', '2 : 4 : 5', '6 : 12 : 15', '8 : 10 : 15'],
      answerIndex: 0,
      explanation: 'Make B equal (LCM of 3 and 4 is 12): A:B = 8:12 and B:C = 12:15. Thus A:B:C = 8:12:15.',
    },
    {
      id: 'rp-2',
      question: 'Find the mean proportional between 9 and 25.',
      options: ['12', '15', '17', '18'],
      answerIndex: 1,
      explanation: 'Mean proportional = sqrt(9 * 25) = sqrt(225) = 15.',
    },
  ],
  partnership: [
    {
      id: 'pa-1',
      question: 'A invests Rs. 20,000 for 12 months and B invests Rs. 30,000 for 8 months. If total profit is Rs. 16,000, what is A’s share?',
      options: ['Rs. 8,000', 'Rs. 6,000', 'Rs. 10,000', 'Rs. 9,600'],
      answerIndex: 0,
      explanation: 'Ratio = (20000 * 12) : (30000 * 8) = 240000 : 240000 = 1 : 1. A’s share = 16000 / 2 = Rs. 8,000.',
    },
  ],
  ages: [
    {
      id: 'ag-1',
      question: 'The present ages of Ravi and Kiran are in the ratio 4 : 5, and the sum of their ages is 54 years. What will be the ratio of their ages after 6 years?',
      options: ['5 : 6', '6 : 7', '4 : 5', '7 : 8'],
      answerIndex: 0,
      explanation: '4x + 5x = 54 => x = 6. Ages are 24 and 30. After 6 years: 30 : 36 = 5 : 6.',
    },
  ],
  average: [
    {
      id: 'av-1',
      question: 'The average of 5 numbers is 20. If one number is excluded, the average becomes 18. What is the excluded number?',
      options: ['24', '26', '28', '30'],
      answerIndex: 2,
      explanation: 'Sum of 5 numbers = 100. Sum of 4 numbers = 4 * 18 = 72. Excluded number = 100 - 72 = 28.',
    },
  ],
  'permutation-combination': [
    {
      id: 'pm-1',
      question: 'In how many distinct ways can the letters of the word "LEADER" be arranged?',
      options: ['720', '360', '180', '120'],
      answerIndex: 1,
      explanation: 'LEADER has 6 letters with E repeated twice: 6! / 2! = 720 / 2 = 360.',
    },
    {
      id: 'pm-2',
      question: 'From a group of 6 boys and 4 girls, in how many ways can a committee of 4 be formed with exactly 2 boys and 2 girls?',
      options: ['90', '60', '45', '120'],
      answerIndex: 0,
      explanation: '6C2 * 4C2 = 15 * 6 = 90 ways.',
    },
  ],
  probability: [
    {
      id: 'pr-1',
      question: 'Two unbiased dice are thrown simultaneously. What is the probability of getting a sum of 9?',
      options: ['1/6', '1/9', '1/12', '5/36'],
      answerIndex: 1,
      explanation: 'Favorable pairs: (3,6), (4,5), (5,4), (6,3) = 4 out of 36 outcomes. Probability = 4/36 = 1/9.',
    },
    {
      id: 'pr-2',
      question: 'A bag contains 4 red and 6 blue balls. If 1 ball is drawn at random, what is the probability that it is blue?',
      options: ['2/5', '3/5', '1/2', '4/10'],
      answerIndex: 1,
      explanation: 'Total balls = 10. Blue balls = 6. P(Blue) = 6/10 = 3/5.',
    },
  ],
  'calendar-clock': [
    {
      id: 'cc-1',
      question: 'What is the angle between the hour hand and the minute hand of a clock at 3:30?',
      options: ['60°', '75°', '90°', '80°'],
      answerIndex: 1,
      explanation: 'Angle = |30*H - 5.5*M| = |30*3 - 5.5*30| = |90 - 165| = 75 degrees.',
    },
    {
      id: 'cc-2',
      question: 'If January 1, 2024 was a Monday, what day of the week was January 1, 2025?',
      options: ['Tuesday', 'Wednesday', 'Thursday', 'Sunday'],
      answerIndex: 1,
      explanation: '2024 was a leap year (366 days = 52 weeks + 2 odd days). Monday + 2 days = Wednesday.',
    },
  ],
  'boats-streams': [
    {
      id: 'bs-1',
      question: 'A boat travels downstream at 16 km/hr and upstream at 10 km/hr. Find the speed of the boat in still water and the speed of the stream.',
      options: ['13 km/hr, 3 km/hr', '12 km/hr, 4 km/hr', '14 km/hr, 2 km/hr', '13 km/hr, 6 km/hr'],
      answerIndex: 0,
      explanation: 'Still water speed = (16 + 10)/2 = 13 km/hr. Stream speed = (16 - 10)/2 = 3 km/hr.',
    },
  ],
  'alligation-mixture': [
    {
      id: 'am-1',
      question: 'In what ratio must rice at Rs. 40/kg be mixed with rice at Rs. 55/kg so that the mixture is worth Rs. 45/kg?',
      options: ['1 : 2', '2 : 1', '3 : 2', '2 : 3'],
      answerIndex: 1,
      explanation: 'Alligation ratio = (55 - 45) : (45 - 40) = 10 : 5 = 2 : 1.',
    },
  ],
  'area-volume': [
    {
      id: 'ar-1',
      question: 'If the diagonal of a square is 10*sqrt(2) cm, what is its area?',
      options: ['50 sq cm', '100 sq cm', '200 sq cm', '144 sq cm'],
      answerIndex: 1,
      explanation: 'Diagonal = side * sqrt(2) => side = 10 cm. Area = side^2 = 100 sq cm.',
    },
  ],
  'hcf-lcm': [
    {
      id: 'hl-1',
      question: 'The HCF and LCM of two numbers are 12 and 72 respectively. If one number is 24, find the other number.',
      options: ['36', '48', '18', '60'],
      answerIndex: 0,
      explanation: 'Other number = (HCF * LCM) / First number = (12 * 72) / 24 = 36.',
    },
  ],
  'di-tables-charts': [
    {
      id: 'di-1',
      question: 'In a pie chart representing a company budget of Rs. 72 lakh, the R&D sector spans 75 degrees. What is the amount allocated to R&D?',
      options: ['Rs. 12 lakh', 'Rs. 15 lakh', 'Rs. 18 lakh', 'Rs. 20 lakh'],
      answerIndex: 1,
      explanation: 'Amount = (75 / 360) * 72 = 75 / 5 = Rs. 15 lakh.',
    },
    {
      id: 'di-2',
      question: 'A company’s revenue grew from Rs. 200 crore in 2024 to Rs. 250 crore in 2025. What was the percentage growth?',
      options: ['20%', '25%', '30%', '50%'],
      answerIndex: 1,
      explanation: 'Growth% = [(250 - 200) / 200] * 100 = (50 / 200) * 100 = 25%.',
    },
  ],
  'synonyms-antonyms': [
    {
      id: 'sa-1',
      question: 'Choose the word closest in meaning (Synonym) to "EPHEMERAL":',
      options: ['Eternal', 'Short-lived', 'Rigid', 'Abundant'],
      answerIndex: 1,
      explanation: '"Ephemeral" means lasting for a very short time (transitory / short-lived).',
    },
    {
      id: 'sa-2',
      question: 'Choose the word opposite in meaning (Antonym) to "MITIGATE":',
      options: ['Alleviate', 'Aggravate', 'Calm', 'Lessen'],
      answerIndex: 1,
      explanation: '"Mitigate" means to make less severe; its opposite is "Aggravate" (make worse).',
    },
  ],
  'spotting-errors': [
    {
      id: 'se-1',
      question: 'Identify the grammatically correct sentence:',
      options: [
        'Neither the manager nor the employees was present.',
        'Neither the manager nor the employees were present.',
        'Neither the manager or the employees were present.',
        'Neither the manager nor the employees is present.',
      ],
      answerIndex: 1,
      explanation: 'With "neither...nor", the verb agrees with the nearer subject ("employees", plural -> "were").',
    },
    {
      id: 'se-2',
      question: 'Fill in the blank: "Each of the candidates ____ required to submit a resume before Friday."',
      options: ['are', 'were', 'is', 'have been'],
      answerIndex: 2,
      explanation: '"Each" is singular and takes the singular verb "is".',
    },
  ],
  'idioms-one-word': [
    {
      id: 'io-1',
      question: 'What does the idiom "burn the midnight oil" mean?',
      options: [
        'Waste resources recklessly',
        'Work or study late into the night',
        'Start an argument unnecessarily',
        'Avoid taking responsibility',
      ],
      answerIndex: 1,
      explanation: '"Burn the midnight oil" means to work or study late at night.',
    },
    {
      id: 'io-2',
      question: 'One word substitute for "A person who knows many languages":',
      options: ['Philatelist', 'Polyglot', 'Stoic', 'Altruist'],
      answerIndex: 1,
      explanation: 'A polyglot speaks or understands several languages.',
    },
  ],
  'para-jumbles': [
    {
      id: 'pj-1',
      question: 'Arrange P, Q, R, S into a coherent paragraph:\nP: As a result, clean code reduces onboarding time.\nQ: Software maintainability directly affects team velocity.\nR: Well-named abstractions help new engineers understand modules quickly.\nS: Without clear structure, simple bug fixes take days.',
      options: ['Q S R P', 'P Q R S', 'R S Q P', 'S Q P R'],
      answerIndex: 0,
      explanation: 'Q introduces the main theme, S states the negative consequence, R explains how clean code helps, and P concludes with "As a result".',
    },
  ],
  'number-letter-series': [
    {
      id: 'nls-1',
      question: 'Find the next number in the series: 3, 7, 15, 31, 63, ?',
      options: ['95', '125', '127', '131'],
      answerIndex: 2,
      explanation: 'Pattern is *2 + 1: 3*2+1=7, 7*2+1=15, 15*2+1=31, 31*2+1=63, 63*2+1=127.',
    },
    {
      id: 'nls-2',
      question: 'Find the missing term in the letter series: B, E, H, K, ?',
      options: ['M', 'N', 'O', 'P'],
      answerIndex: 1,
      explanation: 'Positions: B(2), E(5), H(8), K(11) — adding +3 each time. 11 + 3 = 14 -> N.',
    },
  ],
  'blood-relations': [
    {
      id: 'br-1',
      question: 'Pointing to a photograph, Amit said, "She is the daughter of my grandfather’s only son." How is the girl in the photograph related to Amit?',
      options: ['Cousin', 'Sister', 'Aunt', 'Niece'],
      answerIndex: 1,
      explanation: 'Amit’s grandfather’s only son is Amit’s father. His father’s daughter is Amit’s sister.',
    },
  ],
  'direction-sense': [
    {
      id: 'ds-1',
      question: 'Meera walks 8 km North, turns right and walks 6 km. How far is she from her starting point?',
      options: ['14 km', '10 km', '12 km', '2 km'],
      answerIndex: 1,
      explanation: 'Shortest distance = sqrt(8^2 + 6^2) = sqrt(64 + 36) = sqrt(100) = 10 km.',
    },
  ],
  'coding-decoding': [
    {
      id: 'cd-1',
      question: 'If in a certain code, "SMART" is written as "TNBSU", how is "LOGIC" written in that code?',
      options: ['MPHJ D', 'MPHJD', 'MPHKD', 'KNFHB'],
      answerIndex: 1,
      explanation: 'Each letter shifts +1 forward: L->M, O->P, G->H, I->J, C->D => MPHJD.',
    },
  ],
  'seating-arrangement': [
    {
      id: 'sea-1',
      question: 'In a row of students, Rohan is 12th from the left end and 17th from the right end. How many students are in the row?',
      options: ['27', '28', '29', '30'],
      answerIndex: 1,
      explanation: 'Total = Left + Right - 1 = 12 + 17 - 1 = 28.',
    },
  ],
  syllogisms: [
    {
      id: 'syl-1',
      question: 'Statements: All laptops are computers. Some computers are tablets.\nConclusions:\nI. Some laptops are tablets.\nII. Some tablets are computers.',
      options: ['Only I follows', 'Only II follows', 'Both I and II follow', 'Neither follows'],
      answerIndex: 1,
      explanation: '"Some computers are tablets" converts directly to "Some tablets are computers" (II follows). Laptops and tablets need not overlap (I does not necessarily follow).',
    },
  ],
  'data-sufficiency': [
    {
      id: 'dsu-1',
      question: 'Question: What is the value of integer X?\nStatement I: X is an even prime number.\nStatement II: X^2 = 4.',
      options: [
        'Statement I alone is sufficient',
        'Statement II alone is sufficient',
        'Both statements together are required',
        'Neither statement is sufficient',
      ],
      answerIndex: 0,
      explanation: '2 is the only even prime number, so Statement I alone uniquely gives X = 2. Statement II gives X = 2 or -2.',
    },
  ],
  'cubes-mirror-patterns': [
    {
      id: 'cmp-1',
      question: 'A cube of side 4 cm is painted red on all faces and then cut into smaller cubes of side 1 cm. How many small cubes have NO face painted?',
      options: ['4', '8', '16', '24'],
      answerIndex: 1,
      explanation: 'n = 4. Unpainted inner cubes = (n - 2)^3 = (4 - 2)^3 = 2^3 = 8.',
    },
  ],
};
