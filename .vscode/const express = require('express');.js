const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 5000;
const JWT_SECRET = 'ai-talim-platforma-secret-key-2024';

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// Fayl yuklash sozlamalari
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = 'uploads/';
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage });

// MongoDB ulanish
mongoose.connect('mongodb://localhost:27017/ai-talim-platforma', {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log('MongoDB ga ulandi'))
.catch(err => console.log('MongoDB ulanish xatosi:', err));

// ==================== MODELLAR ====================
// User modeli
const UserSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { 
        type: String, 
        enum: ['admin', 'teacher', 'student'],
        default: 'student'
    },
    profileImage: { type: String },
    createdAt: { type: Date, default: Date.now },
    lastLogin: { type: Date }
});

const User = mongoose.model('User', UserSchema);

// Course modeli
const CourseSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    teacher: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    category: { type: String, required: true },
    level: { 
        type: String, 
        enum: ['beginner', 'intermediate', 'advanced'],
        default: 'beginner'
    },
    imageUrl: { type: String },
    students: [{ 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User' 
    }],
    isPublished: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
});

const Course = mongoose.model('Course', CourseSchema);

// Lesson modeli
const LessonSchema = new mongoose.Schema({
    title: { type: String, required: true },
    content: { type: String, required: true },
    course: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Course', 
        required: true 
    },
    teacher: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    videoUrl: { type: String },
    fileUrl: { type: String },
    order: { type: Number, required: true },
    duration: { type: Number, default: 45 }, // daqiqalarda
    createdAt: { type: Date, default: Date.now }
});

const Lesson = mongoose.model('Lesson', LessonSchema);

// Test modeli
const QuestionSchema = new mongoose.Schema({
    question: { type: String, required: true },
    options: [{ type: String, required: true }],
    correctAnswer: { type: String, required: true },
    difficulty: { 
        type: String, 
        enum: ['easy', 'medium', 'hard'],
        default: 'medium'
    }
});

const TestSchema = new mongoose.Schema({
    title: { type: String, required: true },
    course: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Course' 
    },
    lesson: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Lesson' 
    },
    questions: [QuestionSchema],
    timeLimit: { type: Number, default: 60 }, // daqiqalarda
    passingScore: { type: Number, default: 60 },
    createdBy: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    createdAt: { type: Date, default: Date.now }
});

const Test = mongoose.model('Test', TestSchema);

// Test natijalari modeli
const ResultSchema = new mongoose.Schema({
    student: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    test: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Test', 
        required: true 
    },
    answers: [{
        questionIndex: Number,
        answer: String,
        isCorrect: Boolean
    }],
    score: { type: Number, required: true },
    timeSpent: { type: Number, default: 0 }, // daqiqalarda
    aiFeedback: {
        strengths: [String],
        weaknesses: [String],
        recommendations: [String]
    },
    completedAt: { type: Date, default: Date.now }
});

const Result = mongoose.model('Result', ResultSchema);

// ==================== MIDDLEWARELAR ====================
const authMiddleware = (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({ 
                success: false, 
                message: 'Kirish uchun token kerak' 
            });
        }
        
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        res.status(401).json({ 
            success: false, 
            message: 'Yaroqsiz token' 
        });
    }
};

const requireRole = (roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ 
                success: false, 
                message: 'Ruxsat yo\'q' 
            });
        }
        next();
    };
};

// ==================== ROUTES ====================

// 1. AUTENTIFIKATSIYA
// Ro'yxatdan o'tish
app.post('/api/auth/register', async (req, res) => {
    try {
        const { name, email, password, role } = req.body;
        
        // Email tekshirish
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'Bu email allaqachon ro\'yxatdan o\'tgan'
            });
        }
        
        // Parolni hash qilish
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Yangi foydalanuvchi
        const user = new User({
            name,
            email,
            password: hashedPassword,
            role: role || 'student'
        });
        
        await user.save();
        
        // Token yaratish
        const token = jwt.sign(
            { 
                userId: user._id, 
                name: user.name,
                email: user.email,
                role: user.role 
            },
            JWT_SECRET,
            { expiresIn: '7d' }
        );
        
        // Yangilangan login sanasi
        user.lastLogin = new Date();
        await user.save();
        
        res.status(201).json({
            success: true,
            message: 'Muvaffaqiyatli ro\'yxatdan o\'tdingiz',
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                profileImage: user.profileImage
            }
        });
        
    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({
            success: false,
            message: 'Server xatosi'
        });
    }
});

// Kirish
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        // Foydalanuvchini topish
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({
                success: false,
                message: 'Email yoki parol noto\'g\'ri'
            });
        }
        
        // Parolni tekshirish
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(400).json({
                success: false,
                message: 'Email yoki parol noto\'g\'ri'
            });
        }
        
        // Token yaratish
        const token = jwt.sign(
            { 
                userId: user._id, 
                name: user.name,
                email: user.email,
                role: user.role 
            },
            JWT_SECRET,
            { expiresIn: '7d' }
        );
        
        // Yangilangan login sanasi
        user.lastLogin = new Date();
        await user.save();
        
        res.json({
            success: true,
            message: 'Muvaffaqiyatli kirish',
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                profileImage: user.profileImage
            }
        });
        
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Server xatosi'
        });
    }
});

// Profil ma'lumotlari
app.get('/api/auth/profile', authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId)
            .select('-password');
            
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Foydalanuvchi topilmadi'
            });
        }
        
        res.json({
            success: true,
            user
        });
        
    } catch (error) {
        console.error('Profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Server xatosi'
        });
    }
});

// 2. ADMIN PANELI
// Barcha foydalanuvchilar
app.get('/api/admin/users', authMiddleware, requireRole(['admin']), async (req, res) => {
    try {
        const users = await User.find()
            .select('-password')
            .sort({ createdAt: -1 });
            
        res.json({
            success: true,
            users
        });
        
    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({
            success: false,
            message: 'Server xatosi'
        });
    }
});

// Foydalanuvchi statistikasi
app.get('/api/admin/stats', authMiddleware, requireRole(['admin']), async (req, res) => {
    try {
        const totalUsers = await User.countDocuments();
        const totalTeachers = await User.countDocuments({ role: 'teacher' });
        const totalStudents = await User.countDocuments({ role: 'student' });
        const totalCourses = await Course.countDocuments();
        const totalTests = await Test.countDocuments();
        
        // Oxirgi 7 kundagi yangi foydalanuvchilar
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        
        const newUsers = await User.countDocuments({
            createdAt: { $gte: sevenDaysAgo }
        });
        
        res.json({
            success: true,
            stats: {
                totalUsers,
                totalTeachers,
                totalStudents,
                totalCourses,
                totalTests,
                newUsers
            }
        });
        
    } catch (error) {
        console.error('Stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Server xatosi'
        });
    }
});

// 3. O'QITUVCHI PANELI
// O'qituvchining kurslari
app.get('/api/teacher/courses', authMiddleware, requireRole(['teacher', 'admin']), async (req, res) => {
    try {
        const courses = await Course.find({ teacher: req.user.userId })
            .populate('students', 'name email')
            .sort({ createdAt: -1 });
            
        res.json({
            success: true,
            courses
        });
        
    } catch (error) {
        console.error('Teacher courses error:', error);
        res.status(500).json({
            success: false,
            message: 'Server xatosi'
        });
    }
});

// Yangi kurs yaratish
app.post('/api/teacher/courses', authMiddleware, requireRole(['teacher', 'admin']), async (req, res) => {
    try {
        const courseData = {
            ...req.body,
            teacher: req.user.userId
        };
        
        const course = new Course(courseData);
        await course.save();
        
        res.status(201).json({
            success: true,
            message: 'Kurs muvaffaqiyatli yaratildi',
            course
        });
        
    } catch (error) {
        console.error('Create course error:', error);
        res.status(500).json({
            success: false,
            message: 'Server xatosi'
        });
    }
});

// Dars yaratish
app.post('/api/teacher/lessons', 
    authMiddleware, 
    requireRole(['teacher', 'admin']),
    upload.single('file'),
    async (req, res) => {
        try {
            const lessonData = {
                ...req.body,
                teacher: req.user.userId,
                fileUrl: req.file ? `/uploads/${req.file.filename}` : null
            };
            
            const lesson = new Lesson(lessonData);
            await lesson.save();
            
            res.status(201).json({
                success: true,
                message: 'Dars muvaffaqiyatli yaratildi',
                lesson
            });
            
        } catch (error) {
            console.error('Create lesson error:', error);
            res.status(500).json({
                success: false,
                message: 'Server xatosi'
            });
        }
    }
);

// Test yaratish
app.post('/api/teacher/tests', authMiddleware, requireRole(['teacher', 'admin']), async (req, res) => {
    try {
        const testData = {
            ...req.body,
            createdBy: req.user.userId
        };
        
        const test = new Test(testData);
        await test.save();
        
        res.status(201).json({
            success: true,
            message: 'Test muvaffaqiyatli yaratildi',
            test
        });
        
    } catch (error) {
        console.error('Create test error:', error);
        res.status(500).json({
            success: false,
            message: 'Server xatosi'
        });
    }
});

// 4. TALABA PANELI
// Barcha kurslar
app.get('/api/student/courses', async (req, res) => {
    try {
        const courses = await Course.find({ isPublished: true })
            .populate('teacher', 'name email')
            .sort({ createdAt: -1 });
            
        res.json({
            success: true,
            courses
        });
        
    } catch (error) {
        console.error('Get courses error:', error);
        res.status(500).json({
            success: false,
            message: 'Server xatosi'
        });
    }
});

// Kursga yozilish
app.post('/api/student/courses/:courseId/enroll', authMiddleware, async (req, res) => {
    try {
        const course = await Course.findById(req.params.courseId);
        
        if (!course) {
            return res.status(404).json({
                success: false,
                message: 'Kurs topilmadi'
            });
        }
        
        // Talaba allaqachon yozilganmi?
        if (course.students.includes(req.user.userId)) {
            return res.status(400).json({
                success: false,
                message: 'Siz allaqachon bu kursga yozilgansiz'
            });
        }
        
        // Kursga qo'shish
        course.students.push(req.user.userId);
        await course.save();
        
        // Talabaning kurslar ro'yxatini yangilash
        await User.findByIdAndUpdate(req.user.userId, {
            $addToSet: { enrolledCourses: course._id }
        });
        
        res.json({
            success: true,
            message: 'Kursga muvaffaqiyatli yozildingiz'
        });
        
    } catch (error) {
        console.error('Enroll error:', error);
        res.status(500).json({
            success: false,
            message: 'Server xatosi'
        });
    }
});

// Talabaning kurslari
app.get('/api/student/my-courses', authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId)
            .populate({
                path: 'enrolledCourses',
                populate: {
                    path: 'teacher',
                    select: 'name email'
                }
            });
            
        res.json({
            success: true,
            courses: user.enrolledCourses || []
        });
        
    } catch (error) {
        console.error('My courses error:', error);
        res.status(500).json({
            success: false,
            message: 'Server xatosi'
        });
    }
});

// 5. TESTLAR
// Testni olish
app.get('/api/tests/:testId', async (req, res) => {
    try {
        const test = await Test.findById(req.params.testId)
            .populate('course', 'title')
            .populate('lesson', 'title');
            
        if (!test) {
            return res.status(404).json({
                success: false,
                message: 'Test topilmadi'
            });
        }
        
        res.json({
            success: true,
            test
        });
        
    } catch (error) {
        console.error('Get test error:', error);
        res.status(500).json({
            success: false,
            message: 'Server xatosi'
        });
    }
});

// Testni topshirish
app.post('/api/tests/:testId/submit', authMiddleware, async (req, res) => {
    try {
        const { answers } = req.body;
        const test = await Test.findById(req.params.testId);
        
        if (!test) {
            return res.status(404).json({
                success: false,
                message: 'Test topilmadi'
            });
        }
        
        // Test natijalarini hisoblash
        const results = answers.map((answer, index) => {
            const question = test.questions[index];
            const isCorrect = question && question.correctAnswer === answer;
            return {
                questionIndex: index,
                answer,
                isCorrect
            };
        });
        
        const correctAnswers = results.filter(r => r.isCorrect).length;
        const score = (correctAnswers / test.questions.length) * 100;
        
        // AI feedback generatsiyasi
        const aiFeedback = {
            strengths: [],
            weaknesses: [],
            recommendations: []
        };
        
        results.forEach((result, index) => {
            const question = test.questions[index];
            if (question) {
                if (result.isCorrect) {
                    aiFeedback.strengths.push(`Savol ${index + 1}: ${question.question.substring(0, 50)}...`);
                } else {
                    aiFeedback.weaknesses.push(`Savol ${index + 1}: ${question.question.substring(0, 50)}...`);
                }
            }
        });
        
        if (aiFeedback.weaknesses.length > 0) {
            aiFeedback.recommendations = [
                "Zaif tomonlaringizni mustahkamlash uchun qo'shimcha mashqlar bajarishingizni tavsiya etamiz",
                "Mavzuni qayta o'rganib chiqing va misollar bilan ishlang"
            ];
        } else {
            aiFeedback.recommendations = [
                "Ajoyib natija! Keyingi mavzuga o'tishingiz mumkin",
                "Bilimingizni mustahkamlaganingiz uchun tabriklaymiz"
            ];
        }
        
        // Natijani saqlash
        const result = new Result({
            student: req.user.userId,
            test: req.params.testId,
            answers: results,
            score,
            aiFeedback
        });
        
        await result.save();
        
        res.json({
            success: true,
            message: 'Test muvaffaqiyatli topshirildi',
            score,
            passed: score >= test.passingScore,
            aiFeedback
        });
        
    } catch (error) {
        console.error('Submit test error:', error);
        res.status(500).json({
            success: false,
            message: 'Server xatosi'
        });
    }
});

// Test natijalari
app.get('/api/student/results', authMiddleware, async (req, res) => {
    try {
        const results = await Result.find({ student: req.user.userId })
            .populate('test', 'title')
            .sort({ completedAt: -1 });
            
        res.json({
            success: true,
            results
        });
        
    } catch (error) {
        console.error('Get results error:', error);
        res.status(500).json({
            success: false,
            message: 'Server xatosi'
        });
    }
});

// 6. AI TAVSIYALARI
app.get('/api/ai/recommendations', authMiddleware, async (req, res) => {
    try {
        // Talabaning oxirgi test natijalari
        const recentResults = await Result.find({ 
            student: req.user.userId 
        })
        .populate('test')
        .sort({ completedAt: -1 })
        .limit(5);
        
        // Kurs tavsiyalari
        const allCourses = await Course.find({ isPublished: true })
            .populate('teacher', 'name')
            .limit(10);
        
        // AI tavsiyalarini generatsiya qilish (simulyatsiya)
        const recommendations = {
            courses: allCourses.slice(0, 3).map(course => ({
                courseId: course._id,
                title: course.title,
                reason: "Sizning bilim darajangizga mos keladi",
                matchPercentage: Math.floor(Math.random() * 30) + 70
            })),
            
            studyPlan: [
                { day: "Dushanba", topic: "AI asoslari", duration: "2 soat" },
                { day: "Seshanba", topic: "Ma'lumotlar tahlili", duration: "1.5 soat" },
                { day: "Chorshanba", topic: "Mashina o'rganishi", duration: "2 soat" },
                { day: "Payshanba", topic: "Amaliy mashqlar", duration: "1 soat" },
                { day: "Juma", topic: "Test ishlash", duration: "1.5 soat" }
            ],
            
            tips: [
                "Kuniga kamida 30 daqiqa kod yozishga sarflang",
                "Haftada 2 marta yangi AI texnologiyalari haqida o'qib chiqing",
                "Amaliy loyihalar bilan shug'ullaning"
            ],
            
            progress: {
                overall: Math.floor(Math.random() * 40) + 60,
                aiBasics: Math.floor(Math.random() * 50) + 50,
                dataAnalysis: Math.floor(Math.random() * 45) + 55,
                programming: Math.floor(Math.random() * 60) + 40
            }
        };
        
        res.json({
            success: true,
            recommendations
        });
        
    } catch (error) {
        console.error('AI recommendations error:', error);
        res.status(500).json({
            success: false,
            message: 'Server xatosi'
        });
    }
});

// 7. PROFILNI YANGILASH
app.put('/api/profile/update', 
    authMiddleware,
    upload.single('profileImage'),
    async (req, res) => {
        try {
            const updates = req.body;
            delete updates.password; // Parolni alohida yangilash kerak
            
            // Agar rasm yuklangan bo'lsa
            if (req.file) {
                updates.profileImage = `/uploads/${req.file.filename}`;
            }
            
            const user = await User.findByIdAndUpdate(
                req.user.userId,
                updates,
                { new: true }
            ).select('-password');
            
            res.json({
                success: true,
                message: 'Profil muvaffaqiyatli yangilandi',
                user
            });
            
        } catch (error) {
            console.error('Update profile error:', error);
            res.status(500).json({
                success: false,
                message: 'Server xatosi'
            });
        }
    }
);

// 8. DARSLAR
app.get('/api/courses/:courseId/lessons', async (req, res) => {
    try {
        const lessons = await Lesson.find({ 
            course: req.params.courseId 
        })
        .populate('teacher', 'name')
        .sort({ order: 1 });
        
        res.json({
            success: true,
            lessons
        });
        
    } catch (error) {
        console.error('Get lessons error:', error);
        res.status(500).json({
            success: false,
            message: 'Server xatosi'
        });
    }
});

// 9. STATISTIKA
app.get('/api/stats/overview', authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId);
        
        let stats = {};
        
        if (user.role === 'admin') {
            stats = {
                totalUsers: await User.countDocuments(),
                totalCourses: await Course.countDocuments(),
                totalTests: await Test.countDocuments(),
                totalLessons: await Lesson.countDocuments(),
                activeUsers: await User.countDocuments({ 
                    lastLogin: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
                })
            };
        } else if (user.role === 'teacher') {
            stats = {
                myCourses: await Course.countDocuments({ teacher: user._id }),
                myStudents: (await Course.find({ teacher: user._id }))
                    .reduce((acc, course) => acc + course.students.length, 0),
                myLessons: await Lesson.countDocuments({ teacher: user._id }),
                myTests: await Test.countDocuments({ createdBy: user._id })
            };
        } else {
            stats = {
                enrolledCourses: user.enrolledCourses?.length || 0,
                completedTests: await Result.countDocuments({ student: user._id }),
                averageScore: await Result.aggregate([
                    { $match: { student: user._id } },
                    { $group: { _id: null, average: { $avg: "$score" } } }
                ]).then(result => result[0]?.average || 0),
                totalStudyTime: await Result.aggregate([
                    { $match: { student: user._id } },
                    { $group: { _id: null, total: { $sum: "$timeSpent" } } }
                ]).then(result => result[0]?.total || 0)
            };
        }
        
        res.json({
            success: true,
            stats
        });
        
    } catch (error) {
        console.error('Stats overview error:', error);
        res.status(500).json({
            success: false,
            message: 'Server xatosi'
        });
    }
});

// 10. TEST NATIJALARI (O'qituvchi uchun)
app.get('/api/teacher/results/:testId', 
    authMiddleware, 
    requireRole(['teacher', 'admin']), 
    async (req, res) => {
        try {
            const test = await Test.findById(req.params.testId);
            
            if (!test) {
                return res.status(404).json({
                    success: false,
                    message: 'Test topilmadi'
                });
            }
            
            // Testni yaratgan o'qituvchi ekanligini tekshirish
            if (test.createdBy.toString() !== req.user.userId && req.user.role !== 'admin') {
                return res.status(403).json({
                    success: false,
                    message: 'Ruxsat yo\'q'
                });
            }
            
            const results = await Result.find({ test: req.params.testId })
                .populate('student', 'name email')
                .sort({ score: -1 });
            
            res.json({
                success: true,
                results
            });
            
        } catch (error) {
            console.error('Get test results error:', error);
            res.status(500).json({
                success: false,
                message: 'Server xatosi'
            });
        }
    }
);

// ==================== FRONTEND FAYLLAR UCHUN ====================
// Bosh sahifa
app.get('/', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>AI Ta'lim Platformasi Backend</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    max-width: 800px;
                    margin: 50px auto;
                    padding: 20px;
                    background-color: #f5f9ff;
                }
                .container {
                    background: white;
                    padding: 30px;
                    border-radius: 10px;
                    box-shadow: 0 5px 15px rgba(0,0,0,0.1);
                }
                h1 {
                    color: #3498db;
                }
                .status {
                    color: #27ae60;
                    font-weight: bold;
                }
                .endpoints {
                    margin-top: 30px;
                }
                .endpoint {
                    background: #f8f9fa;
                    padding: 15px;
                    margin: 10px 0;
                    border-radius: 5px;
                    border-left: 4px solid #3498db;
                }
                code {
                    background: #2c3e50;
                    color: white;
                    padding: 2px 5px;
                    border-radius: 3px;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>🤖 AI Ta'lim Platformasi Backend</h1>
                <p class="status">✅ Server faol: http://localhost:${PORT}</p>
                <p>Platforma backend API servisi muvaffaqiyatli ishga tushdi.</p>
                
                <div class="endpoints">
                    <h3>Asosiy API Endpointlar:</h3>
                    
                    <div class="endpoint">
                        <strong>POST /api/auth/register</strong><br>
                        <code>{name, email, password, role}</code> - Ro'yxatdan o'tish
                    </div>
                    
                    <div class="endpoint">
                        <strong>POST /api/auth/login</strong><br>
                        <code>{email, password}</code> - Kirish
                    </div>
                    
                    <div class="endpoint">
                        <strong>GET /api/student/courses</strong><br>
                        Barcha kurslar ro'yxati
                    </div>
                    
                    <div class="endpoint">
                        <strong>POST /api/tests/:id/submit</strong><br>
                        <code>{answers: []}</code> - Testni topshirish
                    </div>
                    
                    <div class="endpoint">
                        <strong>GET /api/ai/recommendations</strong><br>
                        AI tavsiyalari (token kerak)
                    </div>
                </div>
                
                <p style="margin-top: 30px; color: #666;">
                    <strong>Frontend uchun:</strong><br>
                    Yuqoridagi HTML faylni alohida papkada saqlang va API so'rovlarini shu serverga jo'nating.
                </p>
            </div>
        </body>
        </html>
    `);
});

// ==================== SERVER ISHGA TUSHIRISH ====================
// Uploads papkasini yaratish
if (!fs.existsSync('uploads')) {
    fs.mkdirSync('uploads', { recursive: true });
}

// Demo ma'lumotlar
async function createDemoData() {
    try {
        // Admin mavjudmi?
        const adminExists = await User.findOne({ email: 'admin@ai-talim.uz' });
        if (!adminExists) {
            const hashedPassword = await bcrypt.hash('admin123', 10);
            const admin = new User({
                name: 'Platforma Admini',
                email: 'admin@ai-talim.uz',
                password: hashedPassword,
                role: 'admin'
            });
            await admin.save();
            console.log('Demo admin yaratildi: admin@ai-talim.uz / admin123');
        }
        
        // O'qituvchi mavjudmi?
        const teacherExists = await User.findOne({ email: 'teacher@ai-talim.uz' });
        if (!teacherExists) {
            const hashedPassword = await bcrypt.hash('teacher123', 10);
            const teacher = new User({
                name: 'Ali O\'qituvchi',
                email: 'teacher@ai-talim.uz',
                password: hashedPassword,
                role: 'teacher'
            });
            await teacher.save();
            console.log('Demo o\'qituvchi yaratildi: teacher@ai-talim.uz / teacher123');
        }
        
        // Talaba mavjudmi?
        const studentExists = await User.findOne({ email: 'student@ai-talim.uz' });
        if (!studentExists) {
            const hashedPassword = await bcrypt.hash('student123', 10);
            const student = new User({
                name: 'Vali Talaba',
                email: 'student@ai-talim.uz',
                password: hashedPassword,
                role: 'student'
            });
            await student.save();
            console.log('Demo talaba yaratildi: student@ai-talim.uz / student123');
        }
        
        console.log('Demo ma\'lumotlar yaratildi');
        
    } catch (error) {
        console.error('Demo ma\'lumotlar yaratishda xatolik:', error);
    }
}

// Serverni ishga tushirish
app.listen(PORT, async () => {
    console.log(`🚀 Server ${PORT}-portda ishga tushdi`);
    console.log(`🌐 http://localhost:${PORT}`);
    console.log('📚 AI Ta\'lim Platformasi Backend');
    
    // Demo ma'lumotlarni yaratish
    await createDemoData();
    
    console.log('\n🔑 Demo foydalanuvchilar:');
    console.log('👨‍💼 Admin: admin@ai-talim.uz / admin123');
    console.log('👨‍🏫 O\'qituvchi: teacher@ai-talim.uz / teacher123');
    console.log('👨‍🎓 Talaba: student@ai-talim.uz / student123');
});

// Xatoliklarni ushlash
process.on('unhandledRejection', (err) => {
    console.error('Unhandled Rejection:', err);
});