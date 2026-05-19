export const streams = [
  { id: 'neet', name: 'NEET', subjectCount: 3, totalQuestions: 5, duration: 10, difficulty: 'Medium', marking: { correct: 4, wrong: -1 } },
  { id: 'jee_main', name: 'JEE Main', subjectCount: 3, totalQuestions: 5, duration: 10, difficulty: 'Hard', marking: { correct: 4, wrong: -1 } },
  { id: 'jee_advanced', name: 'JEE Advanced', subjectCount: 3, totalQuestions: 5, duration: 10, difficulty: 'Expert', marking: { correct: 4, wrong: -1 } },
  { id: 'iaat', name: 'IAAT', subjectCount: 2, totalQuestions: 5, duration: 10, difficulty: 'Medium', marking: { correct: 3, wrong: -1 } },
  { id: 'cuet', name: 'CUET', subjectCount: 3, totalQuestions: 5, duration: 10, difficulty: 'Easy', marking: { correct: 5, wrong: -1 } },
  { id: 'bitsat', name: 'BITSAT', subjectCount: 4, totalQuestions: 5, duration: 10, difficulty: 'Medium', marking: { correct: 3, wrong: -1 } }
];

export const questionBank = {
  neet: [
    { id: 'n1', type: 'MCQ', subject: 'Biology', text: 'Which of the following is the powerhouse of the cell?', options: ['Nucleus', 'Mitochondria', 'Ribosome', 'Endoplasmic Reticulum'], correct: [1] },
    { id: 'n2', type: 'MCQ', subject: 'Physics', text: 'What is the SI unit of Force?', options: ['Joule', 'Newton', 'Pascal', 'Watt'], correct: [1] },
    { id: 'n3', type: 'MCQ', subject: 'Chemistry', text: 'What is the pH of pure water at 25°C?', options: ['5', '6', '7', '8'], correct: [2] },
    { id: 'n4', type: 'MCQ', subject: 'Biology', text: 'Which blood group is known as the universal donor?', options: ['A', 'B', 'AB', 'O'], correct: [3] },
    { id: 'n5', type: 'Integer', subject: 'Physics', text: 'If a car travels 100 meters in 5 seconds, what is its speed in m/s?', correct: [20], noNegative: true }
  ],
  jee_main: [
    { id: 'jm1', type: 'MCQ', subject: 'Physics', text: 'A projectile is launched at an angle. At the highest point, its velocity is:', options: ['Zero', 'Maximum', 'Minimum but not zero', 'Depends on mass'], correct: [2] },
    { id: 'jm2', type: 'MCQ', subject: 'Math', text: 'What is the derivative of e^x?', options: ['e^x', 'x*e^(x-1)', 'ln(x)', 'e'], correct: [0] },
    { id: 'jm3', type: 'MSQ', subject: 'Chemistry', text: 'Which of these are noble gases?', options: ['Helium', 'Oxygen', 'Neon', 'Nitrogen'], correct: [0, 2] },
    { id: 'jm4', type: 'Integer', subject: 'Math', text: 'Find the value of 5!', correct: [120], noNegative: true },
    { id: 'jm5', type: 'MCQ', subject: 'Physics', text: 'Which phenomenon proves the transverse nature of light?', options: ['Interference', 'Diffraction', 'Polarization', 'Reflection'], correct: [2] }
  ],
  jee_advanced: [
    { id: 'ja1', type: 'MSQ', subject: 'Physics', text: 'Which of the following are conserved in an elastic collision?', options: ['Momentum', 'Kinetic Energy', 'Potential Energy', 'Force'], correct: [0, 1] },
    { id: 'ja2', type: 'MSQ', subject: 'Math', text: 'Which of the following functions are continuous everywhere?', options: ['sin(x)', '1/x', 'e^x', 'tan(x)'], correct: [0, 2] },
    { id: 'ja3', type: 'Integer', subject: 'Chemistry', text: 'What is the atomic number of Carbon?', correct: [6], noNegative: true },
    { id: 'ja4', type: 'MCQ', subject: 'Physics', text: 'In an AC circuit, resonance occurs when:', options: ['XL = XC', 'R = Z', 'XL > XC', 'XC > XL'], correct: [0] },
    { id: 'ja5', type: 'MCQ', subject: 'Math', text: 'The integral of 1/x dx is:', options: ['x^2/2', 'ln|x|', 'e^x', '-1/x^2'], correct: [1] }
  ],
  iaat: [
    { id: 'i1', type: 'MCQ', subject: 'Aptitude', text: 'If A=1, B=2, then what is C?', options: ['1', '2', '3', '4'], correct: [2] },
    { id: 'i2', type: 'MCQ', subject: 'Math', text: 'What is the square root of 144?', options: ['10', '12', '14', '16'], correct: [1] },
    { id: 'i3', type: 'MSQ', subject: 'Logic', text: 'Which are prime numbers?', options: ['2', '4', '7', '9'], correct: [0, 2] },
    { id: 'i4', type: 'Integer', subject: 'Math', text: 'Solve 15 + 25', correct: [40], noNegative: true },
    { id: 'i5', type: 'MCQ', subject: 'Aptitude', text: 'A is taller than B. B is taller than C. Who is shortest?', options: ['A', 'B', 'C', 'Cannot be determined'], correct: [2] }
  ],
  cuet: [
    { id: 'c1', type: 'MCQ', subject: 'General Test', text: 'Who wrote the Indian National Anthem?', options: ['Mahatma Gandhi', 'Rabindranath Tagore', 'Subhas Chandra Bose', 'Bhagat Singh'], correct: [1] },
    { id: 'c2', type: 'MCQ', subject: 'English', text: 'Synonym of "Happy" is:', options: ['Sad', 'Joyful', 'Angry', 'Tired'], correct: [1] },
    { id: 'c3', type: 'Integer', subject: 'Math', text: 'What is 100 / 4?', correct: [25], noNegative: true },
    { id: 'c4', type: 'MCQ', subject: 'History', text: 'In which year did India gain independence?', options: ['1945', '1947', '1950', '1952'], correct: [1] },
    { id: 'c5', type: 'MCQ', subject: 'Science', text: 'Chemical formula for water is:', options: ['CO2', 'O2', 'H2O', 'NaCl'], correct: [2] }
  ],
  bitsat: [
    { id: 'b1', type: 'MCQ', subject: 'English', text: 'Antonym of "Brave" is:', options: ['Cowardly', 'Strong', 'Bold', 'Heroic'], correct: [0] },
    { id: 'b2', type: 'MCQ', subject: 'Logical Reasoning', text: 'Find the odd one out: Apple, Banana, Orange, Potato', options: ['Apple', 'Banana', 'Orange', 'Potato'], correct: [3] },
    { id: 'b3', type: 'MSQ', subject: 'Physics', text: 'Which are scalar quantities?', options: ['Speed', 'Velocity', 'Mass', 'Force'], correct: [0, 2] },
    { id: 'b4', type: 'Integer', subject: 'Math', text: 'What is 2^5?', correct: [32], noNegative: true },
    { id: 'b5', type: 'MCQ', subject: 'Chemistry', text: 'What gas do plants primarily absorb?', options: ['Oxygen', 'Nitrogen', 'Carbon Dioxide', 'Hydrogen'], correct: [2] }
  ]
};
