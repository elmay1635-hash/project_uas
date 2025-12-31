// Initialize Data
DataManager.init();

const QUESTIONS_PER_SESSION = 10;

const app = {
    state: {
        currentView: 'home',
        data: DataManager.get(),
        currentQuestionIndex: 0,
        userAnswers: [],
        score: 0,
        userData: { name: '' },
        timer: null,
        startTime: null,
        activeQuestions: [] // To store randomized questions
    },

    init() {
        this.renderView('home');
        this.updateIcons();
    },

    navigate(viewId) {
        this.state.currentView = viewId;
        this.renderView(viewId);

        // Update nav active state
        document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
        if (viewId === 'home') document.querySelector('.nav-btn:nth-child(1)').classList.add('active');
        // Add other nav logic if needed
    },

    renderView(viewId) {
        const mainContent = document.getElementById('main-content');
        const template = document.getElementById(`view-${viewId}`);

        if (template) {
            mainContent.innerHTML = template.innerHTML;
            this.updateIcons(); // Re-render icons

            // Post-render logic
            if (viewId === 'admin-dashboard') this.loadAdminDashboard();
            if (viewId === 'admin-login') {
                // Check if already logged in (simple session check via sessionStorage not implemented for simplicity, just re-login)
            }
        }
    },

    updateIcons() {
        if (window.lucide) {
            lucide.createIcons();
        }
    },

    // --- TEST LOGIC ---

    startTest() {
        const nameInput = document.getElementById('participant-name');
        if (!nameInput.value.trim()) {
            alert('Mohon isi nama lengkap Anda!');
            return;
        }

        this.state.userData.name = nameInput.value;
        this.state.currentQuestionIndex = 0;
        this.state.userAnswers = [];
        this.state.score = 0;

        // Randomize questions
        // 1. Get all available questions
        let allQuestions = [...this.state.data.questions];
        // 2. Shuffle them
        this.shuffleArray(allQuestions);
        // 3. Take only the first N questions for this session
        this.state.activeQuestions = allQuestions.slice(0, QUESTIONS_PER_SESSION);

        this.navigate('test-run');
        this.loadQuestion();
        this.startTimer();
    },

    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    },

    loadQuestion() {
        const qIndex = this.state.currentQuestionIndex;
        const questions = this.state.activeQuestions;

        if (qIndex >= questions.length) {
            this.finishTest();
            return;
        }

        const question = questions[qIndex];

        // Update UI
        document.getElementById('question-number').innerText = `Pertanyaan ${qIndex + 1}/${questions.length}`;
        document.getElementById('question-text').innerText = question.text;

        // Progress Bar
        const progress = ((qIndex) / questions.length) * 100;
        document.getElementById('test-progress').style.width = `${progress}%`;

        // Render Options
        const container = document.getElementById('options-container');
        container.innerHTML = '';

        question.options.forEach((opt, idx) => {
            const btn = document.createElement('div');
            btn.className = 'option-card';
            btn.innerHTML = `<span>${opt.text}</span>`;
            btn.onclick = () => this.selectOption(idx, opt);
            container.appendChild(btn);
        });

        // Controls
        document.getElementById('btn-prev').disabled = qIndex === 0;
    },

    selectOption(optIdx, optionData) {
        // Visual selection
        document.querySelectorAll('.option-card').forEach((el, idx) => {
            if (idx === optIdx) el.classList.add('selected');
            else el.classList.remove('selected');
        });

        // Save answer
        this.state.userAnswers[this.state.currentQuestionIndex] = optionData;
    },

    nextQuestion() {
        if (!this.state.userAnswers[this.state.currentQuestionIndex]) {
            alert('Pilih salah satu jawaban sebelum melanjutkan!');
            return;
        }
        this.state.currentQuestionIndex++;
        this.loadQuestion();
    },

    prevQuestion() {
        if (this.state.currentQuestionIndex > 0) {
            this.state.currentQuestionIndex--;
            this.loadQuestion();
        }
    },

    startTimer() {
        let seconds = 0;
        if (this.state.timer) clearInterval(this.state.timer);

        this.state.timer = setInterval(() => {
            seconds++;
            const mins = Math.floor(seconds / 60);
            const secs = seconds % 60;
            const timerEl = document.getElementById('timer');
            if (timerEl) timerEl.innerText = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        }, 1000);
    },

    finishTest() {
        clearInterval(this.state.timer);

        // Calculate Score
        let totalScore = 0;
        this.state.userAnswers.forEach(ans => totalScore += ans.score);
        this.state.score = totalScore;

        // Save Result
        const result = {
            id: Date.now(),
            date: new Date().toISOString(),
            name: this.state.userData.name,
            score: totalScore,
            answers: this.state.userAnswers
        };

        this.state.data.results.push(result);
        DataManager.save(this.state.data);

        this.navigate('result');
        this.showResult(result);
    },

    showResult(result) {
        document.getElementById('result-user-name').innerText = `Peserta: ${result.name}`;

        // Very basic simple generic interpretation logic
        // Max potential score = 3 * number of questions
        const maxScore = this.state.activeQuestions.length * 3;
        const percentage = Math.round((result.score / maxScore) * 100);

        // Animate Circle
        setTimeout(() => {
            document.getElementById('main-score').innerText = `${percentage}%`;
            const circle = document.getElementById('score-circle-path');
            if (circle) circle.setAttribute('stroke-dasharray', `${percentage}, 100`);
        }, 100);

        let typeIndex = 0;
        let desc = "";
        let recs = [];

        if (percentage >= 80) {
            document.getElementById('personality-type').innerText = "Tipe: Dominan / Pemimpin";
            desc = "Anda memiliki potensi kepemimpinan yang kuat, tegas dalam mengambil keputusan, dan berorientasi pada hasil. Anda cenderung ekstrovert dan percaya diri.";
            recs = ["Ikuti pelatihan manajemen", "Ambil peran kepemimpinan dalam organisasi", "Latih kemampuan mendengarkan aktif"];
        } else if (percentage >= 50) {
            document.getElementById('personality-type').innerText = "Tipe: Seimbang / Adaptif";
            desc = "Anda adalah pribadi yang fleksibel, bisa menempatkan diri dalam berbagai situasi. Anda memiliki keseimbangan antara logika dan perasaan.";
            recs = ["Kembangkan skill spesifik yang Anda minati", "Perluas jaringan sosial", "Coba tantangan baru di luar zona nyaman"];
        } else {
            document.getElementById('personality-type').innerText = "Tipe: Reflektif / Analitis";
            desc = "Anda cenderung hati-hati, analitis, dan mendalam. Anda mungkin lebih nyaman bekerja sendiri atau dalam kelompok kecil namun sangat detail.";
            recs = ["Fokus pada detail dan kualitas", "Temukan mentor yang tepat", "Berlatih komunikasi publik"];
        }

        document.getElementById('personality-desc').innerText = desc;

        const recList = document.getElementById('recommendation-list');
        recList.innerHTML = recs.map(r => `<li>${r}</li>`).join('');
    },

    // --- ADMIN LOGIC ---

    loginAdmin() {
        const pass = document.getElementById('admin-pass').value;
        if (pass === this.state.data.adminCode) {
            this.navigate('admin-dashboard');
        } else {
            alert('Kode akses salah!');
        }
    },

    logoutAdmin() {
        this.navigate('home');
    },

    loadAdminDashboard() {
        this.switchAdminTab('questions');
    },

    switchAdminTab(tabName) {
        document.querySelectorAll('.admin-tab-content').forEach(el => el.classList.remove('active'));
        document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));

        document.getElementById(`admin-tab-${tabName}`).classList.add('active');
        // Find button logic skipped for brevity, assumed simple order or class matching

        if (tabName === 'questions') this.renderAdminQuestions();
        if (tabName === 'results') this.renderAdminResults();
    },

    renderAdminQuestions() {
        const list = document.getElementById('admin-questions-list');
        list.innerHTML = this.state.data.questions.map((q, idx) => `
            <div class="question-item">
                <div>
                    <b>Q${idx + 1}:</b> ${q.text.substring(0, 50)}...
                </div>
                <button class="btn btn-sm btn-outline" onclick="app.deleteQuestion(${q.id})">Hapus</button>
            </div>
        `).join('');
    },

    renderAdminResults() {
        const list = document.getElementById('admin-results-list');
        list.innerHTML = this.state.data.results.map(r => `
            <tr>
                <td>${new Date(r.date).toLocaleDateString()}</td>
                <td>${r.name}</td>
                <td>${r.score}</td>
                <td><button class="btn btn-sm btn-secondary" onclick="app.showResultDetail(${r.id})">Detail</button></td>
            </tr>
        `).join('');
    },

    showAddQuestionModal() {
        const modal = document.getElementById('modal-overlay');
        const container = document.getElementById('modal-container');
        modal.classList.remove('hidden');

        container.innerHTML = `
            <h3>Tambah Soal Baru</h3>
            <div class="form-group" style="margin-top:1rem">
                <label>Pertanyaan</label>
                <input type="text" id="new-q-text" class="form-input" placeholder="Tulis pertanyaan...">
            </div>
            <div class="form-group">
                <label>Pilihan Jawaban (Format: Teks|Skor)</label>
                <input type="text" id="new-q-opt1" class="form-input" placeholder="Opsi A|3">
                <input type="text" id="new-q-opt2" class="form-input" placeholder="Opsi B|2">
                <input type="text" id="new-q-opt3" class="form-input" placeholder="Opsi C|1">
            </div>
            <div class="action-footer">
                <button class="btn btn-secondary" onclick="document.getElementById('modal-overlay').classList.add('hidden')">Batal</button>
                <button class="btn btn-primary" onclick="app.saveNewQuestion()">Simpan</button>
            </div>
        `;
    },

    saveNewQuestion() {
        const text = document.getElementById('new-q-text').value;
        const opt1 = document.getElementById('new-q-opt1').value.split('|');
        const opt2 = document.getElementById('new-q-opt2').value.split('|');
        const opt3 = document.getElementById('new-q-opt3').value.split('|');

        if (!text || opt1.length < 2 || opt2.length < 2 || opt3.length < 2) {
            alert('Format salah! Pastikan mengisi Text|Score (contoh: Setuju|3)');
            return;
        }

        const newQ = {
            id: Date.now(),
            text: text,
            options: [
                { text: opt1[0], score: parseInt(opt1[1]), type: 'Custom' },
                { text: opt2[0], score: parseInt(opt2[1]), type: 'Custom' },
                { text: opt3[0], score: parseInt(opt3[1]), type: 'Custom' }
            ]
        };

        this.state.data.questions.push(newQ);
        DataManager.save(this.state.data);
        document.getElementById('modal-overlay').classList.add('hidden');
        this.renderAdminQuestions();
    },

    showResultDetail(resultId) {
        const result = this.state.data.results.find(r => r.id === resultId);
        if (!result) return;

        const modal = document.getElementById('modal-overlay');
        const container = document.getElementById('modal-container');
        modal.classList.remove('hidden');

        // Build details HTML
        let detailsHtml = '<div class="result-details-list">';
        // Loop through questions to try and match answers
        // Note: This matches by index. If questions are deleted/reordered, it might not be perfect 
        // unless we stored questionId with answers (which we can improve later).
        const maxLen = Math.max(result.answers.length, this.state.data.questions.length);

        result.answers.forEach((ans, idx) => {
            const question = this.state.data.questions[idx];
            const qText = question ? question.text : `Pertanyaan #${idx + 1} (Soal mungkin telah dihapus)`;

            detailsHtml += `
                <div class="div" style="border-bottom:1px solid var(--border); padding: 10px 0;">
                    <p style="font-weight:600; margin-bottom:5px; font-size: 0.95rem">${qText}</p>
                    <div style="display:flex; justify-content:space-between; align-items:center; font-size: 0.9rem">
                        <span style="color: var(--text-muted)">Jawaban: <span style="color: var(--text-main)">${ans.text}</span></span>
                        <span style="background: #e0e7ff; color: var(--primary); padding: 2px 8px; border-radius: 4px; font-size: 0.8rem">${ans.score} Poin</span>
                    </div>
                </div>
            `;
        });
        detailsHtml += '</div>';

        container.innerHTML = `
            <h3>Detail Hasil: ${result.name}</h3>
            <div style="margin-bottom:1rem; color: var(--text-muted); font-size: 0.9rem">
                Tanggal: ${new Date(result.date).toLocaleString()} <br>
                Total Skor: <b style="color: var(--primary)">${result.score}</b>
            </div>
            
            <div style="max-height: 60vh; overflow-y: auto; margin: 1rem 0; padding-right: 5px;">
                ${detailsHtml}
            </div>

            <div class="action-footer" style="text-align: right;">
                <button class="btn btn-primary" onclick="document.getElementById('modal-overlay').classList.add('hidden')">Tutup</button>
            </div>
        `;
    },

    deleteQuestion(id) {
        if (confirm('Yakin ingin menghapus soal ini?')) {
            this.state.data.questions = this.state.data.questions.filter(q => q.id !== id);
            DataManager.save(this.state.data);
            this.renderAdminQuestions();
        }
    }
};

window.onload = () => app.init();
