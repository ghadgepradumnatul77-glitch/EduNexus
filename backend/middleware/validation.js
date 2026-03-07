import { body, param, query, validationResult } from 'express-validator';

// Validation error handler
export const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: errors.array()
        });
    }
    next();
};

// Login validation
export const loginValidation = [
    body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Valid email is required'),
    body('password')
        .notEmpty()
        .withMessage('Password is required'),
    validate
];

// Registration validation
export const registerValidation = [
    body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Valid email is required'),
    body('password')
        .isLength({ min: 8 })
        .withMessage('Password must be at least 8 characters')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
        .withMessage('Password must contain uppercase, lowercase, number and special character'),
    body('firstName')
        .trim()
        .notEmpty()
        .withMessage('First name is required')
        .isLength({ max: 100 })
        .withMessage('First name too long'),
    body('lastName')
        .trim()
        .notEmpty()
        .withMessage('Last name is required')
        .isLength({ max: 100 })
        .withMessage('Last name too long'),
    body('roleId')
        .isUUID()
        .withMessage('Valid role ID is required'),
    validate
];

// Update user validation
export const updateUserValidation = [
    param('id')
        .isUUID()
        .withMessage('Valid user ID is required'),
    body('email')
        .optional()
        .isEmail()
        .normalizeEmail()
        .withMessage('Valid email is required'),
    body('firstName')
        .optional()
        .trim()
        .notEmpty()
        .withMessage('First name cannot be empty')
        .isLength({ max: 100 })
        .withMessage('First name too long'),
    body('lastName')
        .optional()
        .trim()
        .notEmpty()
        .withMessage('Last name cannot be empty')
        .isLength({ max: 100 })
        .withMessage('Last name too long'),
    body('roleId')
        .optional()
        .isUUID()
        .withMessage('Valid role ID is required'),
    validate
];

// UUID param validation
export const uuidValidation = [
    param('id')
        .isUUID()
        .withMessage('Valid ID is required'),
    validate
];

// Pagination validation
export const paginationValidation = [
    query('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Page must be a positive integer'),
    query('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('Limit must be between 1 and 100'),
    validate
];

// Attendance validation
export const attendanceValidation = [
    body('classId')
        .isUUID()
        .withMessage('Valid class ID is required'),
    body('studentId')
        .isUUID()
        .withMessage('Valid student ID is required'),
    body('date')
        .isISO8601()
        .withMessage('Valid date is required'),
    body('status')
        .isIn(['present', 'absent', 'late', 'excused'])
        .withMessage('Invalid attendance status'),
    body('remarks')
        .optional()
        .trim()
        .isLength({ max: 500 })
        .withMessage('Remarks too long'),
    validate
];

// Marks validation
export const marksValidation = [
    body('classId')
        .isUUID()
        .withMessage('Valid class ID is required'),
    body('studentId')
        .isUUID()
        .withMessage('Valid student ID is required'),
    body('examType')
        .trim()
        .notEmpty()
        .withMessage('Exam type is required')
        .isLength({ max: 50 })
        .withMessage('Exam type too long'),
    body('examName')
        .trim()
        .notEmpty()
        .withMessage('Exam name is required')
        .isLength({ max: 100 })
        .withMessage('Exam name too long'),
    body('marksObtained')
        .isFloat({ min: 0 })
        .withMessage('Marks obtained must be a positive number'),
    body('maxMarks')
        .isFloat({ min: 0 })
        .withMessage('Max marks must be a positive number'),
    body('examDate')
        .optional()
        .isISO8601()
        .withMessage('Valid exam date is required'),
    body('remarks')
        .optional()
        .trim()
        .isLength({ max: 500 })
        .withMessage('Remarks too long'),
    validate
];
