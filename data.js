// Question Generator Utility
const QuestionGenerator = {
    contexts: [
        "Saat menghadapi tantangan baru yang sulit",
        "Ketika berada dalam acara sosial yang ramai",
        "Jika ada ketidaksepakatan dalam tim kerja",
        "Saat harus mengambil keputusan mendadak",
        "Ketika merencanakan liburan atau kegiatan",
        "Saat menghadapi kegagalan atau kesalahan",
        "Ketika diminta memimpin sebuah proyek",
        "Saat bertemu dengan orang yang baru dikenal",
        "Ketika ada deadline yang sangat ketat",
        "Saat merasa lelah atau stress"
    ],
    actions: [
        "apa yang biasanya menjadi prioritas utama Anda?",
        "bagaimana reaksi insting pertama Anda?",
        "pendekatan seperti apa yang Anda pilih?",
        "tindakan mana yang paling menggambarkan diri Anda?"
    ],
    optionsHigh: [ // Score 3 (Dominant/Extrovert/Leader)
        "Langsung mengambil kendali dan inisiatif",
        "Berbicara secara terbuka dan meyakinkan orang lain",
        "Fokus pada hasil cepat dan efisiensi",
        "Menghadapi konfrontasi secara langsung",
        "Mencari solusi inovatif dan berani mengambil risiko"
    ],
    optionsMed: [ // Score 2 (Balanced/Social)
        "Berdiskusi dengan orang lain untuk mencari saran",
        "Mencoba menyeimbangkan semua sudut pandang",
        "Tetap tenang dan mengikuti alur yang ada",
        "Mencari kompromi agar semua pihak senang",
        "Membuat perencanaan yang fleksibel"
    ],
    optionsLow: [ // Score 1 (Reflective/Introvert/Detail)
        "Mengamati situasi dan menganalisis detailnya dulu",
        "Mundur sejenak untuk berpikir sendiri",
        "Menghindari konflik dan mencari ketenangan",
        "Fokus pada data, fakta, dan risiko",
        "Menunggu instruksi atau kepastian sebelum bertindak"
    ],

    generate(count = 20) {
        let questions = [];
        for (let i = 0; i < count; i++) {
            // Pick random components
            const ctx = this.contexts[Math.floor(Math.random() * this.contexts.length)];
            const act = this.actions[Math.floor(Math.random() * this.actions.length)];

            // Randomly pick options but keep scores mapped
            const optH = this.optionsHigh[Math.floor(Math.random() * this.optionsHigh.length)];
            const optM = this.optionsMed[Math.floor(Math.random() * this.optionsMed.length)];
            const optL = this.optionsLow[Math.floor(Math.random() * this.optionsLow.length)];

            // Create basic question structure
            const question = {
                id: Date.now() + i, // Unique ID
                text: `${ctx}, ${act}?`,
                options: [
                    { text: optH, score: 3, type: "Dominan" },
                    { text: optM, score: 2, type: "Seimbang" },
                    { text: optL, score: 1, type: "Reflektif" }
                ]
            };

            // Shuffle options visually handled by script logic usually, but here fixed order is ok 
            // OR we can shuffle them here if script doesn't. 
            // (Script usually just renders array order). Let's shuffle options array.
            this.shuffle(question.options);

            questions.push(question);
        }
        return questions;
    },

    shuffle(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }
};

const initialData = {
    // We generate 50 questions automatically on start!
    questions: QuestionGenerator.generate(50),
    results: [],
    adminCode: "Elmacantik"
};

// Simple data manager
const DataManager = {
    init() {
        if (!localStorage.getItem('psikotes_data')) {
            localStorage.setItem('psikotes_data', JSON.stringify(initialData));
        } else {
            // Update admin code if needed
            const data = JSON.parse(localStorage.getItem('psikotes_data'));

            // If user wants "automatic increase", we can append new questions if the pool is small
            // Or just ensure we have a healthy pool.
            if (data.questions.length < 10) {
                const newQs = QuestionGenerator.generate(20);
                data.questions = [...data.questions, ...newQs];
                localStorage.setItem('psikotes_data', JSON.stringify(data));
            }

            if (data.adminCode !== initialData.adminCode) {
                data.adminCode = initialData.adminCode;
                localStorage.setItem('psikotes_data', JSON.stringify(data));
            }
        }
    },
    get() {
        // Always return fresh data structure if needed, but for persistence we read storage
        return JSON.parse(localStorage.getItem('psikotes_data') || JSON.stringify(initialData));
    },
    save(data) {
        localStorage.setItem('psikotes_data', JSON.stringify(data));
    },
    // Expose generator to add more manually if needed via console
    addMoreQuestions(count) {
        const data = this.get();
        const newQs = QuestionGenerator.generate(count);
        data.questions = [...data.questions, ...newQs];
        this.save(data);
        return newQs.length;
    }
};
