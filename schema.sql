-- ============================================
-- ELITE CARE HOSPITAL - DATABASE SCHEMA
-- ============================================
CREATE DATABASE IF NOT EXISTS elitecare CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE elitecare;

-- المستخدمين
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    phone VARCHAR(20),
    password_hash VARCHAR(255) NOT NULL,
    is_admin TINYINT(1) DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- الدكاترة
CREATE TABLE IF NOT EXISTS doctors (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    specialty VARCHAR(200),
    category VARCHAR(50),
    image VARCHAR(500),
    rating DECIMAL(2,1) DEFAULT 5.0,
    rating_count INT DEFAULT 0,
    degree VARCHAR(200),
    experience VARCHAR(100),
    languages VARCHAR(200),
    schedule_day VARCHAR(100),
    schedule_time VARCHAR(100),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- الخدمات
CREATE TABLE IF NOT EXISTS services (
    id INT AUTO_INCREMENT PRIMARY KEY,
    icon VARCHAR(50),
    title VARCHAR(200) NOT NULL,
    short_desc TEXT,
    full_desc TEXT,
    features JSON,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- المواعيد
CREATE TABLE IF NOT EXISTS appointments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    doctor_id INT,
    doctor_name VARCHAR(150),
    specialty VARCHAR(200),
    appointment_date DATE NOT NULL,
    appointment_time VARCHAR(50) NOT NULL,
    status ENUM('pending','confirmed','completed','cancelled') DEFAULT 'pending',
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- التقييمات
CREATE TABLE IF NOT EXISTS reviews (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    doctor_name VARCHAR(150),
    rating TINYINT NOT NULL,
    comment TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- الإشعارات
CREATE TABLE IF NOT EXISTS notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    message TEXT NOT NULL,
    is_read TINYINT(1) DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- رموز استعادة كلمة المرور
CREATE TABLE IF NOT EXISTS password_resets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(150) NOT NULL,
    token VARCHAR(100) NOT NULL,
    expires_at DATETIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- أدمن افتراضي (الإيميل: admin@elitecare.com | الباسورد: Admin@2026) - غيّره فور التشغيل!
INSERT INTO users (first_name, last_name, email, phone, password_hash, is_admin)
VALUES ('Admin', 'Elite Care', 'admin@elitecare.com', '00000000000', '$2y$10$vIozVFMnBZ4WRD87fzK1FOZ.4jpCuOuqf628s8OAhTUz7p4kWj2O.', 1)
ON DUPLICATE KEY UPDATE email = email;

-- ============================================
-- بيانات مبدئية (الأطباء والخدمات) عشان الموقع ميبقاش فاضي
-- أول ما تشغّل الباك إند. الأدمن يقدر يعدّل/يضيف/يحذف منها من لوحة التحكم.
-- ============================================
INSERT INTO doctors (name, specialty, category, image, rating, rating_count, degree, experience, languages, schedule_day, schedule_time) VALUES
('د. أحمد محمد', 'استشاري جراحة القلب والأوعية الدموية', 'cardiology', 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=400&q=80', 5.0, 120, 'زميل الكلية الملكية البريطانية', '20+ سنة خبرة', 'العربية - الإنجليزية', 'السبت - الأربعاء', '9:00 ص - 2:00 م'),
('د. سارة أحمد', 'استشاري جراحة المخ والأعصاب', 'neurology', 'https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=400&q=80', 4.9, 95, 'دكتوراه من جامعة هارفارد', '18+ سنة خبرة', 'العربية - الإنجليزية - الفرنسية', 'الأحد - الخميس', '10:00 ص - 3:00 م'),
('د. خالد العلي', 'استشاري جراحة العظام والمفاصل', 'orthopedics', 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=400&q=80', 5.0, 150, 'زميل جمعية العظام الأمريكية', '22+ سنة خبرة', 'العربية - الإنجليزية', 'السبت - الأربعاء', '11:00 ص - 4:00 م'),
('د. نورا حسن', 'استشاري طب الأطفال', 'pediatrics', 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400&q=80', 5.0, 200, 'دكتوراه من جامعة أكسفورد', '15+ سنة خبرة', 'العربية - الإنجليزية - الألمانية', 'السبت - الخميس', '9:00 ص - 1:00 م'),
('د. محمود إبراهيم', 'أخصائي أمراض القلب التداخلية', 'cardiology', 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=400&q=80', 4.8, 80, 'ماجستير من جامعة القاهرة', '12+ سنة خبرة', 'العربية - الإنجليزية', 'الأحد - الخميس', '2:00 م - 7:00 م'),
('د. ليلى سامي', 'استشاري طب وجراحة العيون', 'ophthalmology', 'https://images.unsplash.com/photo-1612531386530-97286d74c2ea?w=400&q=80', 5.0, 110, 'دكتوراه من جامعة باريس', '16+ سنة خبرة', 'العربية - الإنجليزية - الفرنسية', 'السبت - الأربعاء', '10:00 ص - 2:00 م');

INSERT INTO services (icon, title, short_desc, full_desc, features) VALUES
('fa-heartbeat', 'القلب والأوعية الدموية', 'تشخيص وعلاج أمراض القلب بأحدث التقنيات الجراحية والتداخلية', 'تشخيص وعلاج أمراض القلب بأحدث التقنيات الجراحية والتداخلية. نقدم خدمات تشمل قسطرة القلب، تركيب الدعامات، جراحة القلب المفتوح، وعلاج اضطرابات ضربات القلب.', JSON_ARRAY('قسطرة تشخيصية وعلاجية', 'تركيب دعامات القلب', 'جراحة القلب المفتوح', 'علاج اضطرابات النظم')),
('fa-brain', 'المخ والأعصاب', 'علاج اضطرابات الجهاز العصبي والجراحة العصبية الدقيقة', 'علاج اضطرابات الجهاز العصبي والجراحة العصبية الدقيقة. نقدم خدمات متخصصة في علاج السكتات الدماغية، الصرع، أورام المخ، وجراحة العمود الفقري.', JSON_ARRAY('علاج السكتات الدماغية', 'جراحة أورام المخ', 'علاج الصرع والشلل الرعاش', 'جراحة العمود الفقري')),
('fa-bone', 'جراحة العظام', 'علاج إصابات العظام والمفاصل واستبدال المفاصل الصناعية', 'علاج إصابات العظام والمفاصل واستبدال المفاصل الصناعية. نقدم أحدث تقنيات جراحة المنظار والجراحة الروبوتية لعلاج إصابات الرياضيين وكبار السن.', JSON_ARRAY('استبدال مفاصل الركبة والورك', 'جراحة المنظار المفصلي', 'علاج إصابات الرياضيين', 'جراحة العمود الفقري')),
('fa-baby', 'طب الأطفال', 'رعاية شاملة للأطفال حديثي الولادة حتى سن المراهقة', 'رعاية شاملة للأطفال حديثي الولادة حتى سن المراهقة. نقدم خدمات متخصصة في طب الأطفال الحديثي الولادة، أمراض الجهاز الهضمي، الحساسية، والأمراض المعدية.', JSON_ARRAY('رعاية الأطفال حديثي الولادة', 'التطعيمات والمتابعة', 'علاج الحساسية والربو', 'متابعة النمو والتطور')),
('fa-eye', 'طب العيون', 'جراحات الليزر وتصحيح النظر وعلاج أمراض الشبكية', 'جراحات الليزر وتصحيح النظر وعلاج أمراض الشبكية. نقدم أحدث تقنيات تصحيح النظر بالليزر (LASIK, PRK) وعلاج المياه البيضاء والزرقاء وزراعة القرنية.', JSON_ARRAY('تصحيح النظر بالليزر', 'علاج المياه البيضاء والزرقاء', 'علاج أمراض الشبكية', 'زراعة القرنية')),
('fa-tooth', 'طب الأسنان', 'تجميل الأسنان وزراعة الأسنان وعلاج الجذور', 'تجميل الأسنان وزراعة الأسنان وعلاج الجذور. نقدم خدمات متكاملة تشمل تبييض الأسنان، التقويم، التيجان والجسور، وعلاج آلام الأسنان الطارئة.', JSON_ARRAY('تبييض وتجميل الأسنان', 'زراعة الأسنان', 'التقويم التجميلي', 'علاج الجذور')),
('fa-lungs', 'الجهاز التنفسي', 'علاج أمراض الرئة والحساسية والربو', 'علاج أمراض الرئة والحساسية والربو. نقدم خدمات متخصصة في تشخيص وعلاج أمراض الانسداد الرئوي المزمن، الربو، والالتهابات الرئوية.', JSON_ARRAY('علاج الربو والحساسية', 'أمراض الانسداد الرئوي', 'اضطرابات النوم', 'اختبارات وظائف الرئة')),
('fa-ribbon', 'الأورام', 'علاج السرطان بالكيميائي والإشعاعي والجراحة المتخصصة', 'علاج السرطان بالكيميائي والإشعاعي والجراحة المتخصصة. نقدم برامج علاج متكاملة تشمل العلاج الكيميائي، الإشعاعي، العلاج المناعي، والجراحة الروبوتية.', JSON_ARRAY('العلاج الكيميائي', 'العلاج الإشعاعي', 'العلاج المناعي', 'الجراحة الروبوتية'));

-- ملاحظة: الأطباء والخدمات مالهمش مفتاح فريد (unique key) على الاسم،
-- يعني السكريبت ده يتشغل مرة واحدة بس وقت أول تركيب. لو شغّلته تاني هيتكرر الداتا.
