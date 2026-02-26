<html lang="uz">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>EduAI - Universitet tizimi</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }

        body {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            justify-content: center;
            align-items: center;
            padding: 20px;
        }

        .container {
            width: 100%;
            max-width: 1200px;
        }

        /* EduAI Header */
        .eduai-header {
            text-align: center;
            margin-bottom: 40px;
        }

        .eduai-header h1 {
            font-size: 48px;
            font-weight: 700;
            color: white;
            text-shadow: 0 2px 10px rgba(0,0,0,0.2);
            letter-spacing: 1px;
        }

        .eduai-header h1 span {
            font-weight: 300;
            color: rgba(255,255,255,0.9);
        }

        .eduai-subtitle {
            color: rgba(255,255,255,0.9);
            font-size: 16px;
            margin-top: 10px;
        }

        /* Role Cards */
        .role-cards {
            display: flex;
            justify-content: center;
            gap: 30px;
            flex-wrap: wrap;
        }

        .role-card {
            background: white;
            border-radius: 20px;
            padding: 40px 30px;
            width: 280px;
            text-align: center;
            box-shadow: 0 20px 40px rgba(0,0,0,0.15);
            transition: all 0.3s ease;
            position: relative;
            overflow: hidden;
        }

        .role-card:hover {
            transform: translateY(-10px);
            box-shadow: 0 30px 60px rgba(0,0,0,0.2);
        }

        /* Card Header with gradient line */
        .role-card::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 4px;
            background: linear-gradient(90deg, #667eea, #764ba2);
        }

        /* Icon styles */
        .card-icon {
            width: 100px;
            height: 100px;
            margin: 0 auto 25px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 50%;
            font-size: 48px;
            transition: all 0.3s ease;
        }

        .role-card:hover .card-icon {
            transform: scale(1.1);
        }

        .admin-icon {
            background: linear-gradient(135deg, #e74c3c20, #e74c3c40);
            color: #e74c3c;
        }

        .teacher-icon {
            background: linear-gradient(135deg, #3498db20, #3498db40);
            color: #3498db;
        }

        .student-icon {
            background: linear-gradient(135deg, #2ecc7120, #2ecc7140);
            color: #2ecc71;
        }

        /* Card title */
        .card-title {
            font-size: 28px;
            font-weight: 600;
            color: #333;
            margin-bottom: 10px;
        }

        /* Card subtitle */
        .card-subtitle {
            font-size: 14px;
            color: #666;
            margin-bottom: 30px;
            line-height: 1.6;
        }

        /* Login button */
        .login-btn {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
            padding: 12px 30px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            text-decoration: none;
            border-radius: 30px;
            font-size: 16px;
            font-weight: 500;
            transition: all 0.3s ease;
            border: none;
            cursor: pointer;
            width: 100%;
        }

        .login-btn:hover {
            background: linear-gradient(135deg, #764ba2 0%, #667eea 100%);
            box-shadow: 0 10px 20px rgba(102,126,234,0.3);
        }

        .login-btn i {
            font-size: 14px;
            transition: transform 0.3s ease;
        }

        .login-btn:hover i {
            transform: translateX(5px);
        }

        /* Test accounts section */
        .test-section {
            margin-top: 40px;
            background: rgba(255,255,255,0.1);
            backdrop-filter: blur(10px);
            border-radius: 15px;
            padding: 20px;
            max-width: 600px;
            margin-left: auto;
            margin-right: auto;
        }

        .test-title {
            color: white;
            text-align: center;
            margin-bottom: 15px;
            font-size: 14px;
            opacity: 0.9;
        }

        .test-grid {
            display: flex;
            justify-content: center;
            gap: 20px;
            flex-wrap: wrap;
        }

        .test-item {
            background: rgba(255,255,255,0.15);
            border-radius: 10px;
            padding: 10px 20px;
            color: white;
            font-size: 13px;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 3px;
        }

        .test-item .role {
            font-weight: 600;
            text-transform: uppercase;
            font-size: 11px;
            opacity: 0.8;
        }

        .test-item .username {
            font-size: 14px;
        }

        .test-item .password {
            font-family: monospace;
            background: rgba(0,0,0,0.2);
            padding: 2px 8px;
            border-radius: 12px;
        }

        /* Modal for login form */
        .modal {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.5);
            backdrop-filter: blur(5px);
            z-index: 1000;
            align-items: center;
            justify-content: center;
        }

        .modal.active {
            display: flex;
        }

        .modal-content {
            background: white;
            border-radius: 20px;
            padding: 40px;
            width: 90%;
            max-width: 400px;
            position: relative;
            animation: modalSlide 0.3s ease;
        }

        @keyframes modalSlide {
            from {
                opacity: 0;
                transform: translateY(-30px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }

        .close-modal {
            position: absolute;
            top: 15px;
            right: 20px;
            font-size: 24px;
            cursor: pointer;
            color: #999;
            transition: color 0.3s;
        }

        .close-modal:hover {
            color: #333;
        }

        .modal-icon {
            width: 80px;
            height: 80px;
            margin: 0 auto 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 50%;
            font-size: 36px;
        }

        .modal h2 {
            text-align: center;
            color: #333;
            margin-bottom: 10px;
        }

        .modal-subtitle {
            text-align: center;
            color: #666;
            font-size: 14px;
            margin-bottom: 30px;
        }

        .form-group {
            margin-bottom: 20px;
        }

        label {
            display: block;
            margin-bottom: 8px;
            color: #555;
            font-weight: 500;
            font-size: 14px;
        }

        .input-group {
            position: relative;
        }

        .input-group i {
            position: absolute;
            left: 15px;
            top: 50%;
            transform: translateY(-50%);
            color: #999;
        }

        input {
            width: 100%;
            padding: 12px 15px 12px 45px;
            border: 2px solid #e1e1e1;
            border-radius: 10px;
            font-size: 15px;
            transition: all 0.3s;
        }

        input:focus {
            outline: none;
            border-color: #667eea;
            box-shadow: 0 0 0 3px rgba(102,126,234,0.1);
        }

        .modal-login-btn {
            width: 100%;
            padding: 14px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            border-radius: 10px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: transform 0.2s;
        }

        .modal-login-btn:hover {
            transform: translateY(-2px);
        }

        .alert {
            padding: 15px;
            border-radius: 10px;
            margin-bottom: 20px;
            font-size: 14px;
        }

        .alert-danger {
            background: #f8d7da;
            color: #721c24;
            border: 1px solid #f5c6cb;
        }

        .alert-success {
            background: #d4edda;
            color: #155724;
        }

        /* Responsive */
        @media (max-width: 768px) {
            .eduai-header h1 {
                font-size: 36px;
            }
            
            .role-card {
                width: 100%;
                max-width: 300px;
            }
        }
    </style>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
</head>
<body>
    <div class="container">
        <!-- EduAI Header -->
        <div class="eduai-header">
            <h1>Edu<span>AI</span></h1>
            <div class="eduai-subtitle"></div>
        </div>

    
                    <div style="max-width: 600px; margin: 0 auto 20px;" class="alert alert-{{ category }}"></div>
                
            
    

        <!-- Role Cards -->
        <div class="role-cards">
            <!-- Admin Card -->
            <div class="role-card" onclick="openModal('admin')">
                <div class="card-icon admin-icon">
                    <i class="fas fa-user-shield"></i>
                </div>
                <h2 class="card-title">Admin</h2>
                <p class="card-subtitle">Universitet boshqaruvi</p>
                <button class="login-btn">
                    Kirish <i class="fas fa-arrow-right"></i>
                </button>
            </div>

            <!-- Teacher Card -->
            <div class="role-card" onclick="openModal('teacher')">
                <div class="card-icon teacher-icon">
                    <i class="fas fa-chalkboard-teacher"></i>
                </div>
                <h2 class="card-title">Domla</h2>
                <p class="card-subtitle">O'qituvchi paneli</p>
                <button class="login-btn">
                    Kirish <i class="fas fa-arrow-right"></i>
                </button>
            </div>

            <!-- Student Card -->
            <div class="role-card" onclick="openModal('student')">
                <div class="card-icon student-icon">
                    <i class="fas fa-user-graduate"></i>
                </div>
                <h2 class="card-title">Talaba</h2>
                <p class="card-subtitle">O'quvchi paneli</p>
                <button class="login-btn">
                    Kirish <i class="fas fa-arrow-right"></i>
                </button>
            </div>
        </div>

        <!-- Test Accounts Section -->
        <div class="test-section">
            <div class="test-title">Test hisoblar</div>
            <div class="test-grid">
                <div class="test-item">
                    <span class="role">Admin</span>
                    <span class="username">admin</span>
                    <span class="password">admin123</span>
                </div>
                <div class="test-item">
                    <span class="role">Domla</span>
                    <span class="username">domla1</span>
                    <span class="password">domla123</span>
                </div>
                <div class="test-item">
                    <span class="role">Talaba</span>
                    <span class="username">talaba1</span>
                    <span class="password">talaba123</span>
                </div>
            </div>
        </div>
    </div>

    <!-- Login Modal -->
    <div class="modal" id="loginModal">
        <div class="modal-content">
            <span class="close-modal" onclick="closeModal()">&times;</span>
            
            <div class="modal-icon" id="modalIcon">
                <i class="fas fa-user-shield"></i>
            </div>
            
            <h2 id="modalTitle">Admin kirish</h2>
            <p class="modal-subtitle" id="modalSubtitle">Universitet boshqaruvi</p>
            
            <form method="POST" action="{{ url_for('login') }}">
                <div class="form-group">
                    <label>Foydalanuvchi nomi</label>
                    <div class="input-group">
                        <i class="fas fa-user"></i>
                        <input type="text" name="username" id="username" placeholder="username" required>
                    </div>
                </div>
                
                <div class="form-group">
                    <label>Parol</label>
                    <div class="input-group">
                        <i class="fas fa-lock"></i>
                        <input type="password" name="password" id="password" placeholder="••••••••" required>
                    </div>
                </div>
                
                <button type="submit" class="modal-login-btn">
                    <i class="fas fa-sign-in-alt"></i> Kirish
                </button>
            </form>
            
            <div style="text-align: center; margin-top: 20px; font-size: 12px; color: #999;">
                Test: admin / admin123
            </div>
        </div>
    </div>

    <script>
        function openModal(role) {
            const modal = document.getElementById('loginModal');
            const modalIcon = document.getElementById('modalIcon');
            const modalTitle = document.getElementById('modalTitle');
            const modalSubtitle = document.getElementById('modalSubtitle');
            const usernameInput = document.getElementById('username');
            
            // Rolga qarab o'zgartirish
            if (role === 'admin') {
                modalIcon.className = 'modal-icon admin-icon';
                modalIcon.innerHTML = '<i class="fas fa-user-shield"></i>';
                modalTitle.textContent = 'Admin kirish';
                modalSubtitle.textContent = 'Universitet boshqaruvi';
                usernameInput.placeholder = 'admin';
            } else if (role === 'teacher') {
                modalIcon.className = 'modal-icon teacher-icon';
                modalIcon.innerHTML = '<i class="fas fa-chalkboard-teacher"></i>';
                modalTitle.textContent = 'Domla kirish';
                modalSubtitle.textContent = 'O\'qituvchi paneli';
                usernameInput.placeholder = 'domla1';
            } else if (role === 'student') {
                modalIcon.className = 'modal-icon student-icon';
                modalIcon.innerHTML = '<i class="fas fa-user-graduate"></i>';
                modalTitle.textContent = 'Talaba kirish';
                modalSubtitle.textContent = 'O\'quvchi paneli';
                usernameInput.placeholder = 'talaba1';
            }
            
            modal.classList.add('active');
            
            // Foydalanuvchi nomini avtomatik to'ldirish
            if (role === 'admin') usernameInput.value = 'admin';
            else if (role === 'teacher') usernameInput.value = 'domla1';
            else if (role === 'student') usernameInput.value = 'talaba1';
        }
        
        function closeModal() {
            document.getElementById('loginModal').classList.remove('active');
        }
        
        // Modal tashqarisiga bosilganda yopish
        window.onclick = function(event) {
            const modal = document.getElementById('loginModal');
            if (event.target == modal) {
                closeModal();
            }
        }
        
        // Escape tugmasi bosilganda yopish
        document.addEventListener('keydown', function(event) {
            if (event.key === 'Escape') {
                closeModal();
            }
        });
    </script>
</body>
</html>