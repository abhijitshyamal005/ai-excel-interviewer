// Excel question bank with categorized questions across skill levels

import { ExcelSkillCategory, DifficultyLevel, ExcelQuestion } from '@/lib/types';

export const excelQuestions: Omit<ExcelQuestion, 'id' | 'usageCount' | 'averageScore'>[] = [
  // BASIC FORMULAS - Basic Level
  {
    category: ExcelSkillCategory.BASIC_FORMULAS,
    difficulty: 'basic' as DifficultyLevel,
    text: "How would you calculate the sum of values in cells A1 through A10? Please explain the formula you would use.",
    expectedAnswers: [
      {
        pattern: "=SUM(A1:A10)",
        score: 100,
        explanation: "Correct SUM formula with proper range notation"
      },
      {
        pattern: "SUM(A1:A10)",
        score: 80,
        explanation: "Correct function but missing equals sign"
      },
      {
        pattern: "=A1+A2+A3+A4+A5+A6+A7+A8+A9+A10",
        score: 60,
        explanation: "Mathematically correct but inefficient approach"
      }
    ],
    evaluationRubric: {
      maxScore: 100,
      criteria: [
        {
          name: "Formula Syntax",
          weight: 0.4,
          description: "Correct use of equals sign and function syntax"
        },
        {
          name: "Range Notation",
          weight: 0.4,
          description: "Proper use of colon notation for ranges"
        },
        {
          name: "Function Knowledge",
          weight: 0.2,
          description: "Understanding of SUM function purpose"
        }
      ],
      commonMistakes: [
        {
          pattern: "missing equals sign",
          deduction: 20,
          feedback: "Remember to start formulas with an equals sign (=)"
        },
        {
          pattern: "incorrect range syntax",
          deduction: 30,
          feedback: "Use colon (:) to specify ranges, e.g., A1:A10"
        }
      ],
      partialCreditRules: [
        {
          condition: "mentions SUM function",
          creditPercentage: 50,
          feedback: "Good knowledge of SUM function, but check syntax"
        }
      ]
    },
    tags: ["formulas", "basic", "sum", "ranges"]
  },

  {
    category: ExcelSkillCategory.BASIC_FORMULAS,
    difficulty: 'basic' as DifficultyLevel,
    text: "If you want to find the average of numbers in cells B1 to B20, what formula would you use?",
    expectedAnswers: [
      {
        pattern: "=AVERAGE(B1:B20)",
        score: 100,
        explanation: "Perfect AVERAGE formula"
      },
      {
        pattern: "=SUM(B1:B20)/20",
        score: 85,
        explanation: "Mathematically correct alternative approach"
      }
    ],
    evaluationRubric: {
      maxScore: 100,
      criteria: [
        {
          name: "Function Selection",
          weight: 0.5,
          description: "Choosing appropriate function for averaging"
        },
        {
          name: "Syntax Accuracy",
          weight: 0.5,
          description: "Correct formula syntax and range specification"
        }
      ],
      commonMistakes: [
        {
          pattern: "AVG instead of AVERAGE",
          deduction: 15,
          feedback: "The function is AVERAGE, not AVG in Excel"
        }
      ],
      partialCreditRules: []
    },
    tags: ["formulas", "basic", "average", "statistics"]
  },

  // DATA MANIPULATION - Intermediate Level
  {
    category: ExcelSkillCategory.DATA_MANIPULATION,
    difficulty: 'intermediate' as DifficultyLevel,
    text: "You have a list of employee names in column A and their salaries in column B. How would you find the salary of a specific employee, say 'John Smith', using a lookup function?",
    expectedAnswers: [
      {
        pattern: "=VLOOKUP(\"John Smith\",A:B,2,FALSE)",
        score: 100,
        explanation: "Perfect VLOOKUP with exact match"
      },
      {
        pattern: "=INDEX(B:B,MATCH(\"John Smith\",A:A,0))",
        score: 100,
        explanation: "Excellent INDEX-MATCH combination"
      },
      {
        pattern: "=XLOOKUP(\"John Smith\",A:A,B:B)",
        score: 100,
        explanation: "Modern XLOOKUP function (Excel 365)"
      }
    ],
    evaluationRubric: {
      maxScore: 100,
      criteria: [
        {
          name: "Function Choice",
          weight: 0.4,
          description: "Selecting appropriate lookup function"
        },
        {
          name: "Parameters",
          weight: 0.4,
          description: "Correct function parameters and syntax"
        },
        {
          name: "Match Type",
          weight: 0.2,
          description: "Understanding of exact vs approximate match"
        }
      ],
      commonMistakes: [
        {
          pattern: "missing FALSE parameter",
          deduction: 25,
          feedback: "For exact matches, use FALSE as the last parameter in VLOOKUP"
        },
        {
          pattern: "wrong column index",
          deduction: 30,
          feedback: "Column index should be 2 for the second column (salary)"
        }
      ],
      partialCreditRules: [
        {
          condition: "mentions VLOOKUP concept",
          creditPercentage: 60,
          feedback: "Good understanding of lookup concept, refine the syntax"
        }
      ]
    },
    tags: ["lookup", "vlookup", "data-retrieval", "intermediate"]
  },

  // PIVOT TABLES - Intermediate Level
  {
    category: ExcelSkillCategory.PIVOT_TABLES,
    difficulty: 'intermediate' as DifficultyLevel,
    text: "You have sales data with columns for Date, Salesperson, Product, and Amount. How would you create a pivot table to show total sales by salesperson and product?",
    expectedAnswers: [
      {
        pattern: "drag salesperson to rows, product to columns, amount to values",
        score: 100,
        explanation: "Perfect pivot table structure understanding"
      },
      {
        pattern: "salesperson in row area, product in column area, sum of amount in data area",
        score: 95,
        explanation: "Correct understanding with different terminology"
      }
    ],
    evaluationRubric: {
      maxScore: 100,
      criteria: [
        {
          name: "Field Placement",
          weight: 0.5,
          description: "Correct placement of fields in pivot table areas"
        },
        {
          name: "Aggregation Understanding",
          weight: 0.3,
          description: "Understanding of sum aggregation for amounts"
        },
        {
          name: "Structure Logic",
          weight: 0.2,
          description: "Logical organization of data dimensions"
        }
      ],
      commonMistakes: [
        {
          pattern: "amount in wrong area",
          deduction: 40,
          feedback: "Amount should go in the Values area for aggregation"
        }
      ],
      partialCreditRules: [
        {
          condition: "mentions pivot table creation",
          creditPercentage: 40,
          feedback: "Good awareness of pivot tables, focus on field placement"
        }
      ]
    },
    tags: ["pivot-tables", "data-analysis", "aggregation", "intermediate"]
  },

  // ADVANCED FUNCTIONS - Advanced Level
  {
    category: ExcelSkillCategory.ADVANCED_FUNCTIONS,
    difficulty: 'advanced' as DifficultyLevel,
    text: "How would you create a formula that counts the number of cells in column A that contain text starting with 'Project' and have a corresponding value in column B greater than 1000?",
    expectedAnswers: [
      {
        pattern: "=COUNTIFS(A:A,\"Project*\",B:B,\">1000\")",
        score: 100,
        explanation: "Perfect COUNTIFS with multiple criteria"
      },
      {
        pattern: "=SUMPRODUCT((LEFT(A:A,7)=\"Project\")*(B:B>1000))",
        score: 95,
        explanation: "Advanced SUMPRODUCT approach"
      }
    ],
    evaluationRubric: {
      maxScore: 100,
      criteria: [
        {
          name: "Function Selection",
          weight: 0.4,
          description: "Choosing appropriate multi-criteria function"
        },
        {
          name: "Criteria Syntax",
          weight: 0.4,
          description: "Correct syntax for text and numeric criteria"
        },
        {
          name: "Wildcard Usage",
          weight: 0.2,
          description: "Understanding of wildcard characters"
        }
      ],
      commonMistakes: [
        {
          pattern: "using COUNTIF instead of COUNTIFS",
          deduction: 50,
          feedback: "COUNTIFS is needed for multiple criteria, not COUNTIF"
        }
      ],
      partialCreditRules: [
        {
          condition: "mentions multiple criteria",
          creditPercentage: 60,
          feedback: "Good understanding of the requirement for multiple conditions"
        }
      ]
    },
    tags: ["advanced-functions", "countifs", "criteria", "wildcards"]
  },

  // DATA VISUALIZATION - Intermediate Level
  {
    category: ExcelSkillCategory.DATA_VISUALIZATION,
    difficulty: 'intermediate' as DifficultyLevel,
    text: "You have monthly sales data for the past year. What type of chart would be most appropriate to show the trend over time, and how would you create it?",
    expectedAnswers: [
      {
        pattern: "line chart",
        score: 100,
        explanation: "Line charts are perfect for showing trends over time"
      },
      {
        pattern: "area chart",
        score: 85,
        explanation: "Area charts can also show trends effectively"
      },
      {
        pattern: "column chart",
        score: 70,
        explanation: "Column charts work but are less ideal for time series"
      }
    ],
    evaluationRubric: {
      maxScore: 100,
      criteria: [
        {
          name: "Chart Type Selection",
          weight: 0.6,
          description: "Choosing appropriate chart for time series data"
        },
        {
          name: "Creation Process",
          weight: 0.4,
          description: "Understanding of chart creation steps"
        }
      ],
      commonMistakes: [
        {
          pattern: "pie chart",
          deduction: 60,
          feedback: "Pie charts are not suitable for time series data"
        }
      ],
      partialCreditRules: []
    },
    tags: ["charts", "visualization", "trends", "time-series"]
  },

  // MACROS/VBA - Advanced Level
  {
    category: ExcelSkillCategory.MACROS_VBA,
    difficulty: 'advanced' as DifficultyLevel,
    text: "How would you create a simple macro to automatically format a selected range of cells with bold text and yellow background?",
    expectedAnswers: [
      {
        pattern: "Selection.Font.Bold = True; Selection.Interior.Color = RGB(255, 255, 0)",
        score: 100,
        explanation: "Correct VBA syntax for formatting"
      },
      {
        pattern: "record macro with formatting actions",
        score: 80,
        explanation: "Good understanding of macro recorder approach"
      }
    ],
    evaluationRubric: {
      maxScore: 100,
      criteria: [
        {
          name: "VBA Syntax",
          weight: 0.5,
          description: "Correct VBA code syntax"
        },
        {
          name: "Object Model",
          weight: 0.3,
          description: "Understanding of Excel object model"
        },
        {
          name: "Approach",
          weight: 0.2,
          description: "Logical approach to automation"
        }
      ],
      commonMistakes: [
        {
          pattern: "incorrect object references",
          deduction: 40,
          feedback: "Use Selection object to reference selected cells"
        }
      ],
      partialCreditRules: [
        {
          condition: "mentions macro recorder",
          creditPercentage: 50,
          feedback: "Macro recorder is a good starting point for learning VBA"
        }
      ]
    },
    tags: ["macros", "vba", "automation", "advanced"]
  },

  // DATA MODELING - Advanced Level
  {
    category: ExcelSkillCategory.DATA_MODELING,
    difficulty: 'advanced' as DifficultyLevel,
    text: "You need to create a financial model that calculates monthly loan payments. What function would you use, and what parameters does it require?",
    expectedAnswers: [
      {
        pattern: "=PMT(rate/12, nper*12, pv)",
        score: 100,
        explanation: "Perfect PMT function with proper parameter adjustment"
      },
      {
        pattern: "PMT function with rate, periods, present value",
        score: 85,
        explanation: "Good understanding of PMT function components"
      }
    ],
    evaluationRubric: {
      maxScore: 100,
      criteria: [
        {
          name: "Function Knowledge",
          weight: 0.4,
          description: "Knowledge of PMT function"
        },
        {
          name: "Parameter Understanding",
          weight: 0.4,
          description: "Understanding of rate, nper, pv parameters"
        },
        {
          name: "Period Adjustment",
          weight: 0.2,
          description: "Adjusting annual rate to monthly"
        }
      ],
      commonMistakes: [
        {
          pattern: "not adjusting rate for monthly",
          deduction: 30,
          feedback: "Remember to divide annual rate by 12 for monthly payments"
        }
      ],
      partialCreditRules: []
    },
    tags: ["financial-modeling", "pmt", "loans", "advanced"]
  }
];

// Question selection utilities
export function getQuestionsByCategory(category: ExcelSkillCategory): typeof excelQuestions {
  return excelQuestions.filter(q => q.category === category);
}

export function getQuestionsByDifficulty(difficulty: DifficultyLevel): typeof excelQuestions {
  return excelQuestions.filter(q => q.difficulty === difficulty);
}

export function getQuestionsByCategoryAndDifficulty(
  category: ExcelSkillCategory, 
  difficulty: DifficultyLevel
): typeof excelQuestions {
  return excelQuestions.filter(q => q.category === category && q.difficulty === difficulty);
}

// Skill progression mapping
export const skillProgression: Record<ExcelSkillCategory, DifficultyLevel[]> = {
  [ExcelSkillCategory.BASIC_FORMULAS]: ['basic', 'intermediate', 'advanced'],
  [ExcelSkillCategory.DATA_MANIPULATION]: ['basic', 'intermediate', 'advanced'],
  [ExcelSkillCategory.PIVOT_TABLES]: ['intermediate', 'advanced'],
  [ExcelSkillCategory.ADVANCED_FUNCTIONS]: ['intermediate', 'advanced'],
  [ExcelSkillCategory.DATA_VISUALIZATION]: ['basic', 'intermediate', 'advanced'],
  [ExcelSkillCategory.MACROS_VBA]: ['advanced'],
  [ExcelSkillCategory.DATA_MODELING]: ['advanced']
};

// Question weights for different role levels
export const roleQuestionWeights = {
  basic: {
    [ExcelSkillCategory.BASIC_FORMULAS]: 0.4,
    [ExcelSkillCategory.DATA_MANIPULATION]: 0.3,
    [ExcelSkillCategory.DATA_VISUALIZATION]: 0.2,
    [ExcelSkillCategory.PIVOT_TABLES]: 0.1,
    [ExcelSkillCategory.ADVANCED_FUNCTIONS]: 0.0,
    [ExcelSkillCategory.MACROS_VBA]: 0.0,
    [ExcelSkillCategory.DATA_MODELING]: 0.0
  },
  intermediate: {
    [ExcelSkillCategory.BASIC_FORMULAS]: 0.2,
    [ExcelSkillCategory.DATA_MANIPULATION]: 0.3,
    [ExcelSkillCategory.PIVOT_TABLES]: 0.25,
    [ExcelSkillCategory.DATA_VISUALIZATION]: 0.15,
    [ExcelSkillCategory.ADVANCED_FUNCTIONS]: 0.1,
    [ExcelSkillCategory.MACROS_VBA]: 0.0,
    [ExcelSkillCategory.DATA_MODELING]: 0.0
  },
  advanced: {
    [ExcelSkillCategory.BASIC_FORMULAS]: 0.1,
    [ExcelSkillCategory.DATA_MANIPULATION]: 0.2,
    [ExcelSkillCategory.PIVOT_TABLES]: 0.2,
    [ExcelSkillCategory.ADVANCED_FUNCTIONS]: 0.25,
    [ExcelSkillCategory.DATA_VISUALIZATION]: 0.1,
    [ExcelSkillCategory.MACROS_VBA]: 0.1,
    [ExcelSkillCategory.DATA_MODELING]: 0.05
  }
};