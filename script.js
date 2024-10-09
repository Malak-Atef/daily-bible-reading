// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyCmpiBFNmEm9BTaOWS5S7blm6hBm75yiOw",
    authDomain: "daily-bible-reading-6903b.firebaseapp.com",
    projectId: "daily-bible-reading-6903b",
    storageBucket: "daily-bible-reading-6903b.appspot.com",
    messagingSenderId: "422582479606",
    appId: "1:422582479606:web:017168d5b9d2f23a8a9ad7",
    measurementId: "G-XEN3V1MB2Z"
};

// Initialize Firebase
const app = firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const analytics = firebase.analytics();

// قائمة الإصحاحات من إنجيل يوحنا
const chapters = [
    "إصحاح 1: نص الإصحاح",
    "إصحاح 2: نص الإصحاح",
    "إصحاح 3: نص الإصحاح",
    // أكمل باقي الإصحاحات هنا
];

// قائمة الأسئلة المرتبطة بكل إصحاح (9 أسئلة)
const questionsList = [
    "سؤال 1", "سؤال 2", "سؤال 3", "سؤال 4", "سؤال 5", 
    "سؤال 6", "سؤال 7", "سؤال 8", "سؤال 9"
];

// كلمة مرور المسؤول
const adminPassword = "admin123"; // يمكنك تغيير كلمة المرور

// حساب اليوم الحالي منذ تاريخ معين
const startDate = new Date('2024-10-01');
const currentDate = new Date();
const daysPassed = Math.floor((currentDate - startDate) / (1000 * 60 * 60 * 24));

// إرجاع الإصحاح والأسئلة لليوم الحالي
function getCurrentChapter(day) {
    const index = day % chapters.length;
    return { chapter: chapters[index], questions: getRandomQuestions() };
}

// عرض ثلاثة أسئلة عشوائية من القائمة
function getRandomQuestions() {
    let shuffled = [...questionsList].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, 3);
}

// عرض الإصحاح على الصفحة
function displayChapter() {
    const { chapter } = getCurrentChapter(daysPassed);
    document.getElementById('chapterText').textContent = chapter;

    const status = localStorage.getItem(`day_${daysPassed}_completed`);
    if (status === 'completed') {
        document.getElementById('statusMessage').textContent = 'لقد أكملت الخلوة اليوم! 🌟';
    }
}

// تأكيد قراءة الإصحاح وعرض الأسئلة
function confirmChapterRead() {
    const { questions } = getCurrentChapter(daysPassed);
    const questionsContainer = document.getElementById('questionsContainer');
    questionsContainer.innerHTML = '';
    
    questions.forEach((q, index) => {
        const questionElement = document.createElement('p');
        questionElement.textContent = q + " 📝";
        questionsContainer.appendChild(questionElement);

        const answerInput = document.createElement('textarea');
        answerInput.setAttribute('id', `answer_${index}`);
        answerInput.setAttribute('placeholder', `أدخل إجابتك هنا`);
        questionsContainer.appendChild(answerInput);
    });

    // إظهار الأسئلة وإخفاء زر تأكيد القراءة
    document.querySelector('.questions').style.display = 'block';
    document.getElementById('confirmReading').style.display = 'none';
}

// تسجيل إتمام الخلوة في Firebase مع الإجابات والتاريخ والوقت
function markAsCompleted() {
    const userName = document.getElementById('userName').value.trim();
    if (userName === "") {
        alert("من فضلك أدخل اسمك. 🙏");
        return;
    }

    const answers = [];
    const { questions } = getCurrentChapter(daysPassed);
    let allAnswered = true;

    questions.forEach((q, index) => {
        const answer = document.getElementById(`answer_${index}`).value.trim();
        if (answer === "") {
            allAnswered = false;
        }
        answers.push(answer);
    });

    if (!allAnswered) {
        alert("من فضلك أجب على جميع الأسئلة. ✍️");
        return;
    }

    // Save to Firestore
    db.collection('retreats').add({
        name: userName,
        answers: answers,
        date: firebase.firestore.Timestamp.fromDate(new Date())
    }).then(() => {
        alert('تم تسجيل إتمام الخلوة في Firebase. شكرا! 🌟');
    }).catch((error) => {
        console.error('خطأ في تسجيل البيانات:', error);
    });

    localStorage.setItem(`day_${daysPassed}_completed`, 'completed');
    document.getElementById('statusMessage').textContent = 'تم تسجيل إتمام الخلوة. شكرا! 🌟';
}

// إخراج تقرير يومي بالأشخاص الذين أكملوا الخلوة والإجابات (للمسؤولين فقط)
function generateReport() {
    const enteredPassword = document.getElementById('adminPassword').value;
    
    // التحقق من كلمة مرور المسؤول
    if (enteredPassword !== adminPassword) {
        alert("كلمة المرور غير صحيحة. 🚫");
        return;
    }

    db.collection('retreats').get().then((querySnapshot) => {
        const reportContainer = document.getElementById('reportContainer');
        reportContainer.innerHTML = '';

        if (querySnapshot.empty) {
            reportContainer.textContent = 'لم يتم تسجيل أي شخص لهذا اليوم. 😔';
            return;
        }

        querySnapshot.forEach((doc) => {
            const data = doc.data();
            const userReport = document.createElement('div');
            userReport.innerHTML = `<strong>${data.name}:</strong> (أتم الخلوة في: ${data.date.toDate()})`;

            const answerList = document.createElement('ul');
            data.answers.forEach((answer, index) => {
                const answerItem = document.createElement('li');
                answerItem.textContent = `إجابة سؤال ${index + 1}: ${answer}`;
                answerList.appendChild(answerItem);
            });
            userReport.appendChild(answerList);
            reportContainer.appendChild(userReport);
        });
    }).catch((error) => {
        console.error('خطأ في استرجاع التقرير:', error);
    });
}

// بدء عرض الإصحاح
displayChapter();
