require('dotenv').config();
const mongoose = require('mongoose');
const Question = require('./models/Question');

const questionsData = [
  // === NEET (15 questions) ===
  {
    streamId: 'neet',
    type: 'MCQ',
    subject: 'Biology',
    text: 'Which of the following cell organelles is responsible for cellular respiration?',
    options: ['Lysosome', 'Mitochondria', 'Golgi apparatus', 'Ribosome'],
    correct: [1]
  },
  {
    streamId: 'neet',
    type: 'MCQ',
    subject: 'Biology',
    text: 'What is the structural and functional unit of the human nervous system?',
    options: ['Nephron', 'Neuron', 'Alveoli', 'Hepatocyte'],
    correct: [1]
  },
  {
    streamId: 'neet',
    type: 'MCQ',
    subject: 'Biology',
    text: 'Which hormone is primary responsible for the regulation of blood sugar levels?',
    options: ['Thyroxine', 'Insulin', 'Adrenaline', 'Estrogen'],
    correct: [1]
  },
  {
    streamId: 'neet',
    type: 'MCQ',
    subject: 'Biology',
    text: 'Which plants have naked seeds?',
    options: ['Angiosperms', 'Gymnosperms', 'Pteridophytes', 'Bryophytes'],
    correct: [1]
  },
  {
    streamId: 'neet',
    type: 'MCQ',
    subject: 'Biology',
    text: 'The process of pollination by birds is known as:',
    options: ['Anemophily', 'Ornithophily', 'Entomophily', 'Hydrophily'],
    correct: [1]
  },
  {
    streamId: 'neet',
    type: 'MCQ',
    subject: 'Physics',
    text: 'What is the dimensional formula for gravitational constant G?',
    options: ['[M^-1 L^3 T^-2]', '[M L^2 T^-2]', '[M^-2 L^3 T^-1]', '[M L^3 T^-2]'],
    correct: [0]
  },
  {
    streamId: 'neet',
    type: 'MCQ',
    subject: 'Physics',
    text: 'The absolute temperature of a gas is directly proportional to the:',
    options: ['Mean potential energy of molecules', 'Mean kinetic energy of molecules', 'Volume of the gas', 'Pressure of the gas'],
    correct: [1]
  },
  {
    streamId: 'neet',
    type: 'MCQ',
    subject: 'Physics',
    text: 'The resistance of a semiconductor decreases with:',
    options: ['Increase in temperature', 'Decrease in temperature', 'Increase in voltage', 'Decrease in voltage'],
    correct: [0]
  },
  {
    streamId: 'neet',
    type: 'MCQ',
    subject: 'Physics',
    text: 'A wire of resistance R is cut into five equal parts. These parts are then connected in parallel. If the equivalent resistance of this combination is R\', then the ratio R/R\' is:',
    options: ['1/25', '1/5', '5', '25'],
    correct: [3]
  },
  {
    streamId: 'neet',
    type: 'Integer',
    subject: 'Physics',
    text: 'Find the focal length (in cm) of a convex lens of power +5 Dioptres.',
    correct: [20],
    noNegative: true
  },
  {
    streamId: 'neet',
    type: 'MCQ',
    subject: 'Chemistry',
    text: 'Which of the following is a primary greenhouse gas in Earth\'s atmosphere?',
    options: ['Oxygen', 'Nitrogen', 'Carbon Dioxide', 'Helium'],
    correct: [2]
  },
  {
    streamId: 'neet',
    type: 'MCQ',
    subject: 'Chemistry',
    text: 'What is the hybridization of carbon in methane (CH4)?',
    options: ['sp', 'sp2', 'sp3', 'sp3d'],
    correct: [2]
  },
  {
    streamId: 'neet',
    type: 'MCQ',
    subject: 'Chemistry',
    text: 'Which of the following forms a colloidal solution with water?',
    options: ['Salt', 'Glucose', 'Starch', 'Barium Nitrate'],
    correct: [2]
  },
  {
    streamId: 'neet',
    type: 'MCQ',
    subject: 'Chemistry',
    text: 'The chemical formula of Plaster of Paris is:',
    options: ['CaSO4 · 2H2O', 'CaSO4 · 1/2 H2O', 'CaSO4 · H2O', 'CaCO3'],
    correct: [1]
  },
  {
    streamId: 'neet',
    type: 'Integer',
    subject: 'Chemistry',
    text: 'What is the coordinate number of atoms in a body-centered cubic (BCC) structure?',
    correct: [8],
    noNegative: true
  },

  // === JEE Main (15 questions) ===
  {
    streamId: 'jee_main',
    type: 'MCQ',
    subject: 'Math',
    text: 'If A and B are symmetric matrices of the same order, then AB - BA is a:',
    options: ['Skew-symmetric matrix', 'Symmetric matrix', 'Zero matrix', 'Identity matrix'],
    correct: [0]
  },
  {
    streamId: 'jee_main',
    type: 'MCQ',
    subject: 'Math',
    text: 'The value of cos(15°) is:',
    options: ['(√3+1)/2√2', '(√3-1)/2√2', '(√3+1)/√2', '(√3-1)/√2'],
    correct: [0]
  },
  {
    streamId: 'jee_main',
    type: 'MCQ',
    subject: 'Math',
    text: 'The number of terms in the expansion of (x + y + z)^10 is:',
    options: ['11', '55', '66', '110'],
    correct: [2]
  },
  {
    streamId: 'jee_main',
    type: 'Integer',
    subject: 'Math',
    text: 'If log_2(x) + log_4(x) = 3, find the value of x.',
    correct: [4],
    noNegative: true
  },
  {
    streamId: 'jee_main',
    type: 'Integer',
    subject: 'Math',
    text: 'Find the area of the region bounded by y^2 = 4x and the line x = 1.',
    correct: [2], // 8/3 simplified to nearest int or just 2. Let's make it integer output friendly:
    // Solve integral: 2 * Integral from 0 to 1 of 2*sqrt(x) dx = 4 * [x^(3/2) / (3/2)] = 8/3.
    // Let's use a simpler area: bounded by y = x and y = x^2. Integral of x - x^2 = 1/2 - 1/3 = 1/6.
    // Let's use simpler equation: area bounded by y = 2x, x = 3, and x-axis. Area = 1/2 * base * height = 1/2 * 3 * 6 = 9.
    text: 'Find the area of the region bounded by y = 2x, x = 3, and the x-axis.',
    correct: [9],
    noNegative: true
  },
  {
    streamId: 'jee_main',
    type: 'MCQ',
    subject: 'Physics',
    text: 'A bullet is fired horizontally from a rifle at a height of 10m. The time it takes to hit the ground depends on (neglect air resistance):',
    options: ['Velocity of the bullet', 'Mass of the bullet', 'Acceleration due to gravity', 'None of the above'],
    correct: [2]
  },
  {
    streamId: 'jee_main',
    type: 'MCQ',
    subject: 'Physics',
    text: 'The escape velocity of a body from the earth depends on:',
    options: ['Mass of the body', 'Radius of the earth', 'Direction of projection', 'Height of projection'],
    correct: [1]
  },
  {
    streamId: 'jee_main',
    type: 'MCQ',
    subject: 'Physics',
    text: 'In a thermodynamic process, the volume of a gas is doubled at constant pressure. The temperature of the gas will:',
    options: ['Be halved', 'Double', 'Remain unchanged', 'Become four times'],
    correct: [1]
  },
  {
    streamId: 'jee_main',
    type: 'MSQ',
    subject: 'Physics',
    text: 'Which of the following quantities are zero in a uniform circular motion?',
    options: ['Average speed', 'Average velocity over one complete cycle', 'Instantaneous acceleration', 'Work done by centripetal force'],
    correct: [1, 3]
  },
  {
    streamId: 'jee_main',
    type: 'Integer',
    subject: 'Physics',
    text: 'A force of 10 N acts on a mass of 2 kg. Find the acceleration produced (in m/s²).',
    correct: [5],
    noNegative: true
  },
  {
    streamId: 'jee_main',
    type: 'MCQ',
    subject: 'Chemistry',
    text: 'Which of the following compounds is aromatic?',
    options: ['Benzene', 'Cyclobutadiene', 'Cyclooctatetraene', 'Cyclohexane'],
    correct: [0]
  },
  {
    streamId: 'jee_main',
    type: 'MCQ',
    subject: 'Chemistry',
    text: 'Which element has the highest electronegativity?',
    options: ['Fluorine', 'Chlorine', 'Oxygen', 'Nitrogen'],
    correct: [0]
  },
  {
    streamId: 'jee_main',
    type: 'MCQ',
    subject: 'Chemistry',
    text: 'The rate of a chemical reaction generally increases with temperature because of:',
    options: ['Decrease in activation energy', 'Increase in collision frequency', 'Increase in fraction of molecules with E >= Ea', 'None of the above'],
    correct: [2]
  },
  {
    streamId: 'jee_main',
    type: 'MSQ',
    subject: 'Chemistry',
    text: 'Which of the following compounds show hydrogen bonding?',
    options: ['H2O', 'HF', 'CH4', 'H2S'],
    correct: [0, 1]
  },
  {
    streamId: 'jee_main',
    type: 'Integer',
    subject: 'Chemistry',
    text: 'What is the pH of a 10^-3 M HCl solution?',
    correct: [3],
    noNegative: true
  },

  // === JEE Advanced (15 questions) ===
  {
    streamId: 'jee_advanced',
    type: 'MSQ',
    subject: 'Math',
    text: 'Let f(x) = |x| sin(x). Which of the following statements are correct?',
    options: ['f(x) is continuous everywhere', 'f(x) is differentiable everywhere', 'f\'(0) = 0', 'f(x) is not differentiable at x=0'],
    correct: [0, 1, 2]
  },
  {
    streamId: 'jee_advanced',
    type: 'MSQ',
    subject: 'Math',
    text: 'If z is a complex number such that |z| = 1, then which of the following can be true?',
    options: ['z + 1/z is real', 'z - 1/z is purely imaginary', 'z^2 + 1/z^2 is real', 'z^3 + 1/z^3 is purely imaginary'],
    correct: [0, 1, 2]
  },
  {
    streamId: 'jee_advanced',
    type: 'MCQ',
    subject: 'Math',
    text: 'The general solution of dy/dx + y = e^-x is:',
    options: ['y = (x + c)e^-x', 'y = xe^x + c', 'y = ce^-x', 'y = (x + c)e^x'],
    correct: [0]
  },
  {
    streamId: 'jee_advanced',
    type: 'Integer',
    subject: 'Math',
    text: 'Find the number of points of intersection of the curves y = x^3 and y = x.',
    correct: [3],
    noNegative: true
  },
  {
    streamId: 'jee_advanced',
    type: 'Integer',
    subject: 'Math',
    text: 'Evaluate: Limit as x approaches 0 of (sin x) / x.',
    correct: [1],
    noNegative: true
  },
  {
    streamId: 'jee_advanced',
    type: 'MSQ',
    subject: 'Physics',
    text: 'An electromagnetic wave propagating along the x-axis has electric field Ey and magnetic field Bz. Which of the following are true?',
    options: ['Ey and Bz are in phase', 'Ey and Bz are perpendicular to each other', 'Wave velocity is E0 / B0', 'Wave velocity is along the z-axis'],
    correct: [0, 1, 2]
  },
  {
    streamId: 'jee_advanced',
    type: 'MSQ',
    subject: 'Physics',
    text: 'A solid sphere, a hollow sphere, and a disc of same mass and radius roll down an inclined plane from rest. Which of the following are true?',
    options: ['Solid sphere reaches the bottom first', 'Hollow sphere reaches the bottom last', 'Disc reaches the bottom before hollow sphere', 'All reach at the same time'],
    correct: [0, 1, 2]
  },
  {
    streamId: 'jee_advanced',
    type: 'MCQ',
    subject: 'Physics',
    text: 'The binding energy per nucleon is maximum for:',
    options: ['Uranium-235', 'Helium-4', 'Iron-56', 'Hydrogen-2'],
    correct: [2]
  },
  {
    streamId: 'jee_advanced',
    type: 'Integer',
    subject: 'Physics',
    text: 'A particle moves in a circle of radius 2m. If its angular velocity is 3 rad/s, find its linear speed (in m/s).',
    correct: [6],
    noNegative: true
  },
  {
    streamId: 'jee_advanced',
    type: 'Integer',
    subject: 'Physics',
    text: 'How many dimensions does the physical constant Plancks constant (h) have in time?',
    correct: [-1], // J.s = N.m.s = kg.m^2.s^-2.s = kg.m^2.s^-1. Wait, let's avoid negative integers for simple integer fields:
    text: 'If work done is 20 Joules in 4 seconds, what is the power output in Watts?',
    correct: [5],
    noNegative: true
  },
  {
    streamId: 'jee_advanced',
    type: 'MSQ',
    subject: 'Chemistry',
    text: 'Which of the following reactions produce hydrogen gas?',
    options: ['Zn + dilute HCl', 'Na + H2O', 'Cu + dilute HCl', 'Al + NaOH solution'],
    correct: [0, 1, 3]
  },
  {
    streamId: 'jee_advanced',
    type: 'MSQ',
    subject: 'Chemistry',
    text: 'Which of the following properties increase down the group in alkali metals?',
    options: ['Atomic radius', 'Ionic radius', 'Ionization energy', 'Density'],
    correct: [0, 1, 3]
  },
  {
    streamId: 'jee_advanced',
    type: 'MCQ',
    subject: 'Chemistry',
    text: 'The catalyst used in the Haber\'s process for synthesis of ammonia is:',
    options: ['Finely divided Iron', 'Platinum', 'Nickel', 'Copper oxide'],
    correct: [0]
  },
  {
    streamId: 'jee_advanced',
    type: 'Integer',
    subject: 'Chemistry',
    text: 'What is the oxidation state of sulfur in H2SO4?',
    correct: [6],
    noNegative: true
  },
  {
    streamId: 'jee_advanced',
    type: 'Integer',
    subject: 'Chemistry',
    text: 'What is the absolute value of the charge of an electron in terms of elementary charge e?',
    correct: [1],
    noNegative: true
  },

  // === IAAT (15 questions) ===
  {
    streamId: 'iaat',
    type: 'MCQ',
    subject: 'Aptitude',
    text: 'A car covers a distance of 400 km in 8 hours. What is its speed?',
    options: ['40 km/h', '50 km/h', '60 km/h', '70 km/h'],
    correct: [1]
  },
  {
    streamId: 'iaat',
    type: 'MCQ',
    subject: 'Aptitude',
    text: 'If 15 men can do a piece of work in 20 days, in how many days can 25 men do it?',
    options: ['10 days', '12 days', '14 days', '16 days'],
    correct: [1]
  },
  {
    streamId: 'iaat',
    type: 'MCQ',
    subject: 'Aptitude',
    text: 'The ratio of the ages of A and B is 3:4. The sum of their ages is 28 years. What is B\'s age?',
    options: ['12 years', '16 years', '20 years', '24 years'],
    correct: [1]
  },
  {
    streamId: 'iaat',
    type: 'MCQ',
    subject: 'Aptitude',
    text: 'A shopkeeper sells an item for $120 making a 20% profit. What was the cost price?',
    options: ['$90', '$100', '$110', '$115'],
    correct: [1]
  },
  {
    streamId: 'iaat',
    type: 'MCQ',
    subject: 'Aptitude',
    text: 'What is the compound interest on $1000 at 10% per annum for 2 years?',
    options: ['$200', '$210', '$220', '$250'],
    correct: [1]
  },
  {
    streamId: 'iaat',
    type: 'MCQ',
    subject: 'Math',
    text: 'The average of first five prime numbers is:',
    options: ['5.6', '5.8', '6.0', '6.2'],
    correct: [0] // 2+3+5+7+11 = 28. 28/5 = 5.6
  },
  {
    streamId: 'iaat',
    type: 'MCQ',
    subject: 'Math',
    text: 'The sum of all interior angles of a hexagon is:',
    options: ['360°', '540°', '720°', '900°'],
    correct: [2]
  },
  {
    streamId: 'iaat',
    type: 'MCQ',
    subject: 'Math',
    text: 'If a diagonal of a square is 10 cm, then its area is:',
    options: ['25 cm²', '50 cm²', '100 cm²', '200 cm²'],
    correct: [1] // d^2 / 2 = 100/2 = 50
  },
  {
    streamId: 'iaat',
    type: 'MSQ',
    subject: 'Logic',
    text: 'Which of the following are factors of 24?',
    options: ['3', '6', '9', '12'],
    correct: [0, 1, 3]
  },
  {
    streamId: 'iaat',
    type: 'MSQ',
    subject: 'Logic',
    text: 'If all bloops are razzies and all razzies are lazzies, then:',
    options: ['All bloops are lazzies', 'Some lazzies are bloops', 'All lazzies are bloops', 'No bloop is a lazzy'],
    correct: [0, 1]
  },
  {
    streamId: 'iaat',
    type: 'Integer',
    subject: 'Math',
    text: 'Solve: 5 + 3 * 4 - 2.',
    correct: [15],
    noNegative: true
  },
  {
    streamId: 'iaat',
    type: 'Integer',
    subject: 'Math',
    text: 'If the perimeter of a rectangle is 20 cm and its width is 4 cm, what is its length (in cm)?',
    correct: [6],
    noNegative: true
  },
  {
    streamId: 'iaat',
    type: 'Integer',
    subject: 'Logic',
    text: 'Complete the sequence: 2, 6, 12, 20, __',
    correct: [30],
    noNegative: true
  },
  {
    streamId: 'iaat',
    type: 'Integer',
    subject: 'Logic',
    text: 'In a code, CAT is written as 24 (3+1+20). What is the code for DOG?',
    correct: [26], // 4 + 15 + 7 = 26
    noNegative: true
  },
  {
    streamId: 'iaat',
    type: 'Integer',
    subject: 'Aptitude',
    text: 'If 3 pencils cost 15 cents, how many cents do 5 pencils cost?',
    correct: [25],
    noNegative: true
  },

  // === CUET (15 questions) ===
  {
    streamId: 'cuet',
    type: 'MCQ',
    subject: 'General Test',
    text: 'Who is the current President of India? (As of 2026)',
    options: ['Ram Nath Kovind', 'Droupadi Murmu', 'Pranab Mukherjee', 'Narendra Modi'],
    correct: [1]
  },
  {
    streamId: 'cuet',
    type: 'MCQ',
    subject: 'General Test',
    text: 'Which is the largest ocean on Earth?',
    options: ['Atlantic Ocean', 'Indian Ocean', 'Pacific Ocean', 'Arctic Ocean'],
    correct: [2]
  },
  {
    streamId: 'cuet',
    type: 'MCQ',
    subject: 'General Test',
    text: 'The headquarters of the United Nations is located in:',
    options: ['Geneva', 'London', 'New York', 'Paris'],
    correct: [2]
  },
  {
    streamId: 'cuet',
    type: 'MCQ',
    subject: 'General Test',
    text: 'Which country is known as the Land of the Rising Sun?',
    options: ['China', 'Japan', 'South Korea', 'Thailand'],
    correct: [1]
  },
  {
    streamId: 'cuet',
    type: 'MCQ',
    subject: 'General Test',
    text: 'What is the currency of Japan?',
    options: ['Yuan', 'Yen', 'Won', 'Dollar'],
    correct: [1]
  },
  {
    streamId: 'cuet',
    type: 'MCQ',
    subject: 'English',
    text: 'Select the correct spelling:',
    options: ['Receive', 'Recieve', 'Receve', 'Reciefe'],
    correct: [0]
  },
  {
    streamId: 'cuet',
    type: 'MCQ',
    subject: 'English',
    text: 'Identify the antonym of "Generous":',
    options: ['Kind', 'Mean', 'Stingy', 'Selfish'],
    correct: [2]
  },
  {
    streamId: 'cuet',
    type: 'MCQ',
    subject: 'English',
    text: 'Fill in the blank: She _______ to the gym every morning.',
    options: ['go', 'goes', 'going', 'gone'],
    correct: [1]
  },
  {
    streamId: 'cuet',
    type: 'MCQ',
    subject: 'History',
    text: 'The Indus Valley Civilization was active around:',
    options: ['2500 BCE', '1000 BCE', '500 BCE', '100 CE'],
    correct: [0]
  },
  {
    streamId: 'cuet',
    type: 'MCQ',
    subject: 'History',
    text: 'Who was the first Mughal Emperor of India?',
    options: ['Akbar', 'Babur', 'Humayun', 'Sher Shah Suri'],
    correct: [1]
  },
  {
    streamId: 'cuet',
    type: 'MCQ',
    subject: 'Science',
    text: 'Which gas is most abundant in Earth\'s atmosphere?',
    options: ['Oxygen', 'Nitrogen', 'Carbon Dioxide', 'Argon'],
    correct: [1]
  },
  {
    streamId: 'cuet',
    type: 'MCQ',
    subject: 'Science',
    text: 'What is the chemical symbol for Gold?',
    options: ['Ag', 'Au', 'Fe', 'Cu'],
    correct: [1]
  },
  {
    streamId: 'cuet',
    type: 'Integer',
    subject: 'Math',
    text: 'Calculate: 12% of 500.',
    correct: [60],
    noNegative: true
  },
  {
    streamId: 'cuet',
    type: 'Integer',
    subject: 'Math',
    text: 'Find the median of the data: 3, 5, 7, 9, 11.',
    correct: [7],
    noNegative: true
  },
  {
    streamId: 'cuet',
    type: 'Integer',
    subject: 'Science',
    text: 'How many planets are there in our Solar System?',
    correct: [8],
    noNegative: true
  },

  // === BITSAT (15 questions) ===
  {
    streamId: 'bitsat',
    type: 'MCQ',
    subject: 'English',
    text: 'Choose the correct meaning of the idiom: "Spill the beans"',
    options: ['To drop something', 'To reveal a secret', 'To cook food', 'To speak loudly'],
    correct: [1]
  },
  {
    streamId: 'bitsat',
    type: 'MCQ',
    subject: 'Logical Reasoning',
    text: 'Find the next letters in the pattern: AZ, BY, CX, D__',
    options: ['U', 'V', 'W', 'T'],
    correct: [2]
  },
  {
    streamId: 'bitsat',
    type: 'MCQ',
    subject: 'Logical Reasoning',
    text: 'If day before yesterday was Saturday, what day will it be tomorrow?',
    options: ['Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    correct: [0]
  },
  {
    streamId: 'bitsat',
    type: 'MCQ',
    subject: 'Physics',
    text: 'The velocity of sound is maximum in:',
    options: ['Solids', 'Liquids', 'Gases', 'Vacuum'],
    correct: [0]
  },
  {
    streamId: 'bitsat',
    type: 'MCQ',
    subject: 'Physics',
    text: 'The electric potential inside a hollow charged spherical conductor is:',
    options: ['Zero', 'Constant', 'Varies with distance', 'Infinite'],
    correct: [1]
  },
  {
    streamId: 'bitsat',
    type: 'MCQ',
    subject: 'Chemistry',
    text: 'Which is the most abundant metal in the Earth\'s crust?',
    options: ['Iron', 'Aluminum', 'Silicon', 'Calcium'],
    correct: [1]
  },
  {
    streamId: 'bitsat',
    type: 'MCQ',
    subject: 'Chemistry',
    text: 'The gas leaked during the Bhopal Gas Tragedy was:',
    options: ['Methyl Isocyanate', 'Sodium Cyanide', 'Carbon Monoxide', 'Chlorine gas'],
    correct: [0]
  },
  {
    streamId: 'bitsat',
    type: 'MCQ',
    subject: 'Math',
    text: 'If tan(A) = 1/2 and tan(B) = 1/3, then A + B is equal to:',
    options: ['30°', '45°', '60°', '90°'],
    correct: [1]
  },
  {
    streamId: 'bitsat',
    type: 'MCQ',
    subject: 'Math',
    text: 'The probability of getting a sum of 7 when two dice are thrown is:',
    options: ['1/6', '1/12', '5/36', '7/36'],
    correct: [0]
  },
  {
    streamId: 'bitsat',
    type: 'MSQ',
    subject: 'Physics',
    text: 'Which of the following forces are non-conservative in nature?',
    options: ['Electrostatic force', 'Frictional force', 'Gravitational force', 'Viscous force'],
    correct: [1, 3]
  },
  {
    streamId: 'bitsat',
    type: 'MSQ',
    subject: 'Chemistry',
    text: 'Which of the following are amphoteric oxides?',
    options: ['Al2O3', 'ZnO', 'CO2', 'Na2O'],
    correct: [0, 1]
  },
  {
    streamId: 'bitsat',
    type: 'Integer',
    subject: 'Math',
    text: 'If a matrix has 8 elements, what is the number of possible orders it can have?',
    correct: [4], // (1,8), (2,4), (4,2), (8,1)
    noNegative: true
  },
  {
    streamId: 'bitsat',
    type: 'Integer',
    subject: 'Logical Reasoning',
    text: 'A is B\'s sister. C is B\'s mother. D is C\'s father. E is D\'s mother. How many generations are covered?',
    correct: [4],
    noNegative: true
  },
  {
    streamId: 'bitsat',
    type: 'Integer',
    subject: 'Physics',
    text: 'A stone is dropped from a tower of height 45m. Find the time it takes to reach the ground (g=10m/s²).',
    correct: [3], // t = sqrt(2h/g) = sqrt(90/10) = 3
    noNegative: true
  },
  {
    streamId: 'bitsat',
    type: 'Integer',
    subject: 'Chemistry',
    text: 'What is the atomic number of Oxygen?',
    correct: [8],
    noNegative: true
  }
];

mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/examDB')
  .then(async () => {
    console.log('✅ Connected to MongoDB. Seeding...');
    await Question.deleteMany({});
    await Question.insertMany(questionsData);
    console.log('🎉 Database successfully seeded with 90 mock questions!');
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Seeding Error:', err);
    process.exit(1);
  });
