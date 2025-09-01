    const { useState, useEffect } = React;

    function App() {
        // Button to play correct pronunciation
        const playCorrectPronunciation = () => {
            const isChinese = /[\u4e00-\u9fff]/.test(currentWord.english);
            const text = currentWord.english;
            const lang = isChinese ? 'zh-CN' : 'en-US';
            const utter = new window.SpeechSynthesisUtterance(text);
            utter.lang = lang;
            window.speechSynthesis.speak(utter);
        };
        // ...existing code...
        // For homophones, you can add a list to each word, e.g. word.homophones = ['同音1', '同音2']
        // State for recording
        const [isRecording, setIsRecording] = useState(false);
        const [recordResult, setRecordResult] = useState("");
        const recognitionRef = React.useRef(null);

        // Function to start recording and check pronunciation
        const handleRecord = () => {
            setRecordResult("");
            if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
                alert('Trình duyệt không hỗ trợ kiểm tra giọng nói!');
                return;
            }
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            const recognition = new SpeechRecognition();
            recognition.lang = /[\u4e00-\u9fff]/.test(currentWord.english) ? 'zh-CN' : 'en-US';
            recognition.interimResults = false;
            recognition.maxAlternatives = 3; // Tăng số lượng kết quả thay thế
            recognition.continuous = false; // Chỉ ghi âm một lần
            setIsRecording(true);

            let hasResult = false; // Biến để theo dõi xem đã có kết quả chưa

            recognition.onresult = (event) => {
                hasResult = true;
                setIsRecording(false);
                
                // Lấy tất cả các kết quả thay thế
                const results = [];
                for (let i = 0; i < event.results[0].length; i++) {
                    results.push(event.results[0][i].transcript.trim().toLowerCase());
                }

                let target = currentWord.english.trim().toLowerCase();
                
                // Kiểm tra xem có kết quả nào khớp không
                let matched = false;
                for (let transcript of results) {
                    if (transcript === target) {
                        matched = true;
                        break;
                    }
                }

                if (matched) {
                    setRecordResult('✅ Đúng!');
                    // Có thể thêm âm thanh hoặc hiệu ứng khi đúng
                } else {
                    setRecordResult('❌ Sai! Bạn vừa đọc: ' + results[0] + 
                        (results.length > 1 ? '\nCác phiên bản khác: ' + results.slice(1).join(', ') : ''));
                }
            };

            recognition.onerror = (event) => {
                setIsRecording(false);
                console.error('Speech recognition error:', event.error);
                setRecordResult('⚠️ Lỗi: ' + 
                    (event.error === 'no-speech' ? 'Không nghe thấy giọng nói' :
                     event.error === 'audio-capture' ? 'Không tìm thấy micro' :
                     event.error === 'not-allowed' ? 'Vui lòng cho phép quyền sử dụng micro' :
                     'Không nhận diện được giọng nói'));
            };

            recognition.onend = () => {
                setIsRecording(false);
                // Nếu kết thúc mà không có kết quả nào, hiển thị thông báo
                if (!hasResult) {
                    setRecordResult('⚠️ Không nghe rõ. Vui lòng thử lại và nói to hơn.');
                }
            };

            // Timeout sau 5 giây nếu không có kết quả
            setTimeout(() => {
                if (isRecording) {
                    recognition.stop();
                }
            }, 5000);

            try {
                recognition.start();
                recognitionRef.current = recognition;
            } catch (error) {
                console.error('Speech recognition start error:', error);
                setIsRecording(false);
                setRecordResult('⚠️ Không thể bắt đầu ghi âm. Vui lòng thử lại.');
            }
        };
        // ...existing code...
        useEffect(() => {
            if (window.Chart && document.getElementById('learnChart') && step === 3 && quizMode) {
                setTimeout(() => {
                    const ctx = document.getElementById('learnChart');
                    if (!ctx || !window.Chart) return;
                    const days = [];
                    const counts = [];
                    const maxCount = [];
                    let totalWords = 0;

                    for (let i = 6; i >= 0; i--) {
                        const d = new Date();
                        d.setDate(d.getDate() - i);
                        const key = 'learnedToday_' + d.toISOString().slice(0, 10);
                        const arr = JSON.parse(localStorage.getItem(key) || '[]');
                        days.push(d.toLocaleDateString('vi-VN', { weekday: 'short', day: '2-digit', month: '2-digit' }));
                        counts.push(arr.length);
                        totalWords += arr.length;
                        maxCount.push(vocabList.length);
                    }

                    if (window.learnChartInstance) window.learnChartInstance.destroy();
                    window.learnChartInstance = new window.Chart(ctx, {
                        type: 'bar',
                        data: {
                            labels: days,
                            datasets: [
                                {
                                    label: 'Số từ đã học',
                                    data: counts,
                                    backgroundColor: 'rgba(33,150,243,0.8)',
                                    borderColor: '#1976d2',
                                    borderWidth: 1,
                                    borderRadius: 5,
                                    barThickness: 20,
                                },
                                {
                                    label: 'Mục tiêu',
                                    data: maxCount,
                                    type: 'line',
                                    borderColor: '#ff9800',
                                    borderDash: [5, 5],
                                    fill: false,
                                    pointStyle: false
                                }
                            ]
                        },
                        options: {
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: {
                                legend: {
                                    display: true,
                                    position: 'top',
                                    labels: {
                                        usePointStyle: true,
                                        padding: 15,
                                        font: {
                                            size: 12
                                        }
                                    }
                                },
                                tooltip: {
                                    mode: 'index',
                                    intersect: false,
                                    backgroundColor: 'rgba(255,255,255,0.9)',
                                    titleColor: '#333',
                                    bodyColor: '#666',
                                    borderColor: '#ddd',
                                    borderWidth: 1,
                                    padding: 10,
                                    displayColors: true,
                                    callbacks: {
                                        label: function(context) {
                                            return context.dataset.label + ': ' + context.parsed.y + ' từ';
                                        }
                                    }
                                }
                            },
                            scales: {
                                y: {
                                    beginAtZero: true,
                                    grid: {
                                        display: true,
                                        color: 'rgba(0,0,0,0.05)'
                                    },
                                    ticks: {
                                        stepSize: 5
                                    }
                                },
                                x: {
                                    grid: {
                                        display: false
                                    }
                                }
                            }
                        }
                    });
                }, 100);
            }
        }, [learnedToday, step, quizMode]);
        // ...existing code...
        // Inline edit state for saved link
        const [editLinkMode, setEditLinkMode] = useState(false);
        const [editTitle, setEditTitle] = useState("");
        const [editUrl, setEditUrl] = useState("");
        const [sheetLink, setSheetLink] = useState("https://docs.google.com/spreadsheets/d/e/2PACX-1vS3FMBV2dhviH0qZycRqYaXxvxJVvtYJtr_x43GE57Bw7IlgS0PV1PJ6aKDN3CPyiCrIEnMK536gZxr/pubhtml");
        const [vocabList, setVocabList] = useState([]);
        const [currentIndex, setCurrentIndex] = useState(0);
        const [showVietnamese, setShowVietnamese] = useState(false);
        const [unknownWords, setUnknownWords] = useState(() => {
            const saved = localStorage.getItem("unknownWords");
            return saved ? JSON.parse(saved) : [];
        });
        const [isReviewingUnknown, setIsReviewingUnknown] = useState(false);
        const [savedLinks, setSavedLinks] = useState(() => {
            const saved = localStorage.getItem("savedLinks");
            return saved ? JSON.parse(saved) : [];
        });
        const [newTitle, setNewTitle] = useState("");
        const [inputChinese, setInputChinese] = useState("");
        const [checkResult, setCheckResult] = useState("");
        const [showLinkPanel, setShowLinkPanel] = useState(false);
        const [quizMode, setQuizMode] = useState(null); // null, 'vi-en', 'en-vi'
        const [languageMode, setLanguageMode] = useState(null); // 'en', 'zh'
        const [step, setStep] = useState(1); // 1: nhập/chọn link, 2: chọn kiểu học, 3: học
        // State lưu số từ đã học trong ngày
        const [learnedToday, setLearnedToday] = useState(() => {
            const today = new Date().toISOString().slice(0, 10);
            const saved = localStorage.getItem('learnedToday_' + today);
            return saved ? JSON.parse(saved) : [];
        });

        useEffect(() => {
            localStorage.setItem("unknownWords", JSON.stringify(unknownWords));
        }, [unknownWords]);

        useEffect(() => {
            if (step === 1 && savedLinks.length > 0) {
                // Nếu sheetLink không nằm trong danh sách đã lưu thì reset về ""
                if (!savedLinks.some(l => l.url === sheetLink)) {
                    setSheetLink("");
                }
            }
        }, [step, savedLinks]);

        const convertToCsvLink = (link) => link.replace("/pubhtml", "/pub?output=csv");

        const fetchVocabulary = async (csvUrl) => {
            try {
                const res = await fetch(csvUrl);
                const text = await res.text();
                const lines = text.split("\n").slice(1);
                const list = lines.map(line => {
                    const parts = line.split(",");
                    if (parts.length >= 2) {
                        // Cột A: english, B: wordType, C: vietnamese, D: example
                        const word = {
                            english: parts[0] ? parts[0].trim() : "",
                            wordType: parts[1] ? parts[1].trim() : "",
                            vietnamese: parts[2] ? parts[2].trim() : "",
                            example: parts[3] ? parts[3].trim() : ""
                        };
                        return word;
                    }
                    return null;
                }).filter(Boolean);
                setVocabList(list);
                setCurrentIndex(0);
                setShowVietnamese(false);
            } catch (e) {
                alert("Không thể tải dữ liệu, kiểm tra link!");
                console.error(e);
            }
        };

        const handleLoad = () => {
            if (!sheetLink) return;
            const csvLink = convertToCsvLink(sheetLink);
            fetchVocabulary(csvLink);
        };

        useEffect(() => { handleLoad(); }, []);

        useEffect(() => {
            handleLoad();
            setQuizMode(null); // Reset quiz mode mỗi lần load link mới
        }, [sheetLink]);

        const resetWordState = () => {
            setShowVietnamese(false);
            setInputChinese("");
            setCheckResult("");
            setRecordResult("");
            // Đảm bảo ghi âm được dừng nếu đang ghi
            if (recognitionRef.current) {
                try {
                    recognitionRef.current.stop();
                } catch (e) {
                    console.log("Recognition already stopped");
                }
            }
            setIsRecording(false);
        };

        const handleNext = () => {
            resetWordState();
            setCurrentIndex((prev) => {
                const nextIndex = (prev + 1) % currentList.length;
                // Thêm delay nhỏ để đảm bảo UI được cập nhật
                setTimeout(() => {
                    if (currentList[nextIndex]) {
                        const isChinese = /[\u4e00-\u9fff]/.test(currentList[nextIndex].english);
                        const text = currentList[nextIndex].english;
                        // Tự động phát âm từ mới
                        const utter = new window.SpeechSynthesisUtterance(text);
                        utter.lang = isChinese ? 'zh-CN' : 'en-US';
                        window.speechSynthesis.speak(utter);
                    }
                }, 100);
                return nextIndex;
            });
        };

        const handlePrev = () => {
            resetWordState();
            setCurrentIndex((prev) => {
                const newIndex = Math.max(prev - 1, 0);
                // Thêm delay nhỏ để đảm bảo UI được cập nhật
                setTimeout(() => {
                    if (currentList[newIndex]) {
                        const isChinese = /[\u4e00-\u9fff]/.test(currentList[newIndex].english);
                        const text = currentList[newIndex].english;
                        // Tự động phát âm từ mới
                        const utter = new window.SpeechSynthesisUtterance(text);
                        utter.lang = isChinese ? 'zh-CN' : 'en-US';
                        window.speechSynthesis.speak(utter);
                    }
                }, 100);
                return newIndex;
            });
        };

        const handleRepeat = () => {
            if (!currentList.length) return;
            
            resetWordState();
            const offset = Math.floor(Math.random() * 8) + 3;
            const insertIndex = Math.min(currentIndex + offset, currentList.length);
            const newList = [...currentList];
            newList.splice(insertIndex, 0, currentList[currentIndex]);
            setVocabList(newList);
            
            setCurrentIndex(currentIndex + 1);
            
            // Thêm delay nhỏ để đảm bảo UI được cập nhật
            setTimeout(() => {
                if (currentWord) {
                    const isChinese = /[\u4e00-\u9fff]/.test(currentWord.english);
                    const text = currentWord.english;
                    // Tự động phát âm từ mới
                    const utter = new window.SpeechSynthesisUtterance(text);
                    utter.lang = isChinese ? 'zh-CN' : 'en-US';
                    window.speechSynthesis.speak(utter);
                }
            }, 100);
        };

        const handleUnknown = () => {
            if (!vocabList.length) return;
            const word = vocabList[currentIndex];
            if (!unknownWords.some(w => w.english === word.english && w.vietnamese === word.vietnamese)) {
                setUnknownWords([...unknownWords, word]);
            }
            setShowVietnamese(true);
        };

        const handleReviewUnknown = () => {
            if (unknownWords.length === 0) return;
            setIsReviewingUnknown(true);
            setCurrentIndex(0);
            setShowVietnamese(false);
        };

        const handleBackToAll = () => {
            setIsReviewingUnknown(false);
            setCurrentIndex(0);
            setShowVietnamese(false);
        };

        const handleSaveLink = () => {
            if (!sheetLink || !newTitle.trim()) return;
            const newLink = { title: newTitle.trim(), url: sheetLink };
            // Tránh trùng title
            if (!savedLinks.some(l => l.title === newLink.title)) {
                const updated = [...savedLinks, newLink];
                setSavedLinks(updated);
                localStorage.setItem("savedLinks", JSON.stringify(updated));
                setNewTitle("");
            }
        };

        const handleLoadSavedLink = (url) => {
            setSheetLink(url);
            handleLoad();
        };

        const handleDeleteSavedLink = (title) => {
            const updated = savedLinks.filter(l => l.title !== title);
            setSavedLinks(updated);
            localStorage.setItem("savedLinks", JSON.stringify(updated));
        };

        const handleSelectLink = (url) => {
            setSheetLink(url);
            // Không chuyển bước ở đây nữa
        };

        const handleSaveLinkAndNext = () => {
            handleSaveLink();
            setStep(2);
        };

        const handleSelectQuizMode = (mode) => {
            setQuizMode(mode);
            setStep(3);
        };

        const handleBackStep = () => {
            if (step === 2) {
                setQuizMode(null);
                setStep(1);
                setSheetLink(""); // Reset sheetLink về rỗng khi quay lại bước 1
            } else if (step === 3) {
                setQuizMode(null);
                setStep(2);
                setInputChinese(""); // Reset trường nhập
                setCheckResult(""); // Reset kết quả kiểm tra
                setShowVietnamese(false); // Reset nút hiển thị nghĩa
                setCurrentIndex(0); // Quay lại từ đầu danh sách
                setIsReviewingUnknown(false); // Reset chế độ học lại từ chưa thuộc
            }
        };

        // Sửa lại handleCorrect: KHÔNG xoá khỏi unknownWords hay vocabList, chỉ cập nhật learnedToday
        const handleCorrect = (word) => {
            const today = new Date().toISOString().slice(0, 10);
            if (!learnedToday.some(w => w.english === word.english && w.vietnamese === word.vietnamese)) {
                const updated = [...learnedToday, word];
                setLearnedToday(updated);
                localStorage.setItem('learnedToday_' + today, JSON.stringify(updated));
            }
            // KHÔNG xoá khỏi unknownWords hay vocabList nữa
            // Chỉ chuyển sang từ tiếp theo nếu còn
            setCurrentIndex(i => {
                // Khi chuyển sang từ mới, clear input, checkResult và ẩn nghĩa/ví dụ
                setInputChinese("");
                setCheckResult("");
                setShowVietnamese(false);
                return Math.min(i + 1, currentList.length - 1);
            });
        };

        const currentList = isReviewingUnknown ? unknownWords : vocabList;
        const currentWord = currentList[currentIndex];

        // Khôi phục layout ban đầu: nội dung và button đều căn giữa, không chia 2 cột
        return (
            <div className="container">
                <h1 className="app-title">😸 Chíp Chíp</h1>
                <div style={{ background: '#f9f9f9', borderRadius: 12, padding: 16, marginTop: 8, position: 'relative' }}>
                    {step === 1 && (
                        <div style={{ margin: '32px 0', textAlign: 'center' }}>
                            <div style={{ marginBottom: '18px', fontSize: '1.1rem', color: '#1976d2', fontWeight: 'bold', letterSpacing: '0.5px' }}>
                                👉 Bước 1: Nhập link Google Sheet hoặc chọn link đã lưu
                            </div>
                            <div style={{ maxWidth: 400, margin: '0 auto' }}>
                                <input
                                    type="text"
                                    value={sheetLink}
                                    onChange={e => setSheetLink(e.target.value)}
                                    placeholder="Dán link Google Sheet..."
                                    className="panel-input"
                                    style={{ marginBottom: 12 }}
                                />
                                <input
                                    type="text"
                                    value={newTitle}
                                    onChange={e => setNewTitle(e.target.value)}
                                    placeholder="Nhập tiêu đề cho link..."
                                    className="panel-input"
                                    style={{ marginBottom: 12 }}
                                />
                                <div className="panel-btn-group" style={{ marginBottom: 12 }}>
                                    <button onClick={handleSaveLinkAndNext} className="panel-btn main" style={{ width: 'auto', minWidth: 0, padding: '8px 12px', whiteSpace: 'nowrap' }}>💾 Lưu & Tiếp tục</button>
                                    
                                </div>
                                {savedLinks.length > 0 && (
                                    <div style={{ marginBottom: 12 }}>
                                        <label className="panel-label" 
                                        style={{ marginBottom: '18px', fontSize: '1.1rem', color: '#1976d2', fontWeight: 'bold', letterSpacing: '0.5px' }}
                                        >Chọn link đã lưu</label>
                                        <select
                                            className="panel-select"
                                            value={sheetLink}
                                            onChange={e => handleSelectLink(e.target.value)}
                                        >
                                            <option value="">-- Chọn link --</option>
                                            {savedLinks.map(link => (
                                                <option key={link.title} value={link.url}>{link.title}</option>
                                            ))}
                                        </select>
                                        {/* Hiển thị nút sửa và xoá cho link đã chọn */}
                                        {sheetLink && (
                                            editLinkMode ? (
                                                <div>
                                                    <div style={{
                                                        position: 'fixed',
                                                        top: 0,
                                                        left: 0,
                                                        width: '100vw',
                                                        height: '100vh',
                                                        background: 'rgba(0,0,0,0.25)',
                                                        zIndex: 1000,
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                    }}>
                                                        <div style={{
                                                            background: '#fff',
                                                            borderRadius: 12,
                                                            boxShadow: '0 4px 24px rgba(0,0,0,0.12)',
                                                            padding: '24px 20px',
                                                            minWidth: 320,
                                                            maxWidth: 380,
                                                            display: 'flex',
                                                            flexDirection: 'column',
                                                            alignItems: 'center',
                                                        }}>
                                                            <h3 style={{ color: '#1976d2', marginBottom: 12, fontWeight: 'bold', fontSize: '1.1rem' }}>Chỉnh sửa link đã lưu</h3>
                                                            <input
                                                                type="text"
                                                                value={editTitle}
                                                                onChange={e => setEditTitle(e.target.value)}
                                                                placeholder="Tiêu đề mới..."
                                                                style={{ width: '90%', marginBottom: 8, padding: '8px 10px', borderRadius: 6, border: '1px solid #ccc', fontSize: '1rem' }}
                                                            />
                                                            <input
                                                                type="text"
                                                                value={editUrl}
                                                                onChange={e => setEditUrl(e.target.value)}
                                                                placeholder="URL mới..."
                                                                style={{ width: '90%', marginBottom: 12, padding: '8px 10px', borderRadius: 6, border: '1px solid #ccc', fontSize: '1rem' }}
                                                            />
                                                            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                                                                <button
                                                                    className="panel-btn main"
                                                                    style={{ width: 'auto', minWidth: 0, padding: '8px 16px', whiteSpace: 'nowrap', background: '#4CAF50', color: '#fff', fontWeight: 'bold', borderRadius: 8 }}
                                                                    onClick={() => {
                                                                        if (!editTitle.trim() || !editUrl.trim()) {
                                                                            alert('Vui lòng nhập đủ tiêu đề và URL!');
                                                                            return;
                                                                        }
                                                                        if (savedLinks.some(l => l.title === editTitle && l.url !== sheetLink)) {
                                                                            alert('Tiêu đề đã tồn tại!');
                                                                            return;
                                                                        }
                                                                        const updatedLinks = savedLinks.map(l =>
                                                                            l.url === sheetLink ? { ...l, title: editTitle.trim(), url: editUrl.trim() } : l
                                                                        );
                                                                        setSavedLinks(updatedLinks);
                                                                        localStorage.setItem("savedLinks", JSON.stringify(updatedLinks));
                                                                        setSheetLink(editUrl.trim());
                                                                        setEditLinkMode(false);
                                                                    }}
                                                                >Lưu</button>
                                                                <button
                                                                    className="panel-btn"
                                                                    style={{ width: 'auto', minWidth: 0, padding: '8px 16px', whiteSpace: 'nowrap', background: '#ffcdd2', color: '#d32f2f', fontWeight: 'bold', borderRadius: 8 }}
                                                                    onClick={() => setEditLinkMode(false)}
                                                                >Huỷ</button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div style={{ display: 'flex', gap: '8px', marginTop: 8, justifyContent: 'center' }}>
                                                    <button
                                                        className="panel-btn"
                                                        style={{ width: 'auto', minWidth: 0, padding: '8px 12px', whiteSpace: 'nowrap', background: '#e3eafc', color: '#1976d2', fontWeight: 'bold' }}
                                                        onClick={() => {
                                                            const link = savedLinks.find(l => l.url === sheetLink);
                                                            if (!link) return;
                                                            setEditTitle(link.title);
                                                            setEditUrl(link.url);
                                                            setEditLinkMode(true);
                                                        }}
                                                    >Chỉnh sửa</button>
                                                    <button
                                                        className="panel-btn"
                                                        style={{ width: 'auto', minWidth: 0, padding: '8px 12px', whiteSpace: 'nowrap', background: '#ffcdd2', color: '#d32f2f', fontWeight: 'bold' }}
                                                        onClick={() => {
                                                            const link = savedLinks.find(l => l.url === sheetLink);
                                                            if (!link) return;
                                                            if (!window.confirm('Bạn có chắc muốn xoá link này?')) return;
                                                            const updatedLinks = savedLinks.filter(l => l.url !== link.url);
                                                            setSavedLinks(updatedLinks);
                                                            localStorage.setItem("savedLinks", JSON.stringify(updatedLinks));
                                                            setSheetLink("");
                                                        }}
                                                    >Xoá</button>
                                                    <button
                                                        className="panel-btn main"
                                                        style={{ width: 'auto', minWidth: 0, padding: '8px 12px', whiteSpace: 'nowrap', background: '#e3eafc', color: '#1976d2', fontWeight: 'bold' }}
                                                        onClick={() => setStep(2)}
                                                    >Tiếp tục </button>
                                                </div>
                                            )
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                    {step === 2 && (
                        <div style={{ margin: '32px 0', textAlign: 'center' }}>
                            <div style={{ marginBottom: '18px', fontSize: '1.1rem', color: '#1976d2', fontWeight: 'bold', letterSpacing: '0.5px' }}>
                                👉 Bước 2: Chọn kiểu học
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'center', gap: '24px', marginBottom: '18px' }}>
                                <button
                                    onClick={() => handleSelectQuizMode('vi-en')}
                                    style={{ background: '#2196F3', color: '#fff', fontWeight: 'bold', padding: '8px 14px', borderRadius: 12, fontSize: '1.08rem', boxShadow: '0 2px 8px rgba(33,150,243,0.10)', border: 'none', transition: '0.2s', width: 'auto', minWidth: 0, whiteSpace: 'nowrap' }}>
                                    Từ Việt sang Tiếng
                                </button>
                                <button
                                    onClick={() => handleSelectQuizMode('en-vi')}
                                    style={{ background: '#4CAF50', color: '#fff', fontWeight: 'bold', padding: '8px 14px', borderRadius: 12, fontSize: '1.08rem', boxShadow: '0 2px 8px rgba(76,175,80,0.10)', border: 'none', transition: '0.2s', width: 'auto', minWidth: 0, whiteSpace: 'nowrap' }}>
                                    Từ Tiếng sang Việt
                                </button>
                            </div>
                            <button onClick={handleBackStep} className="panel-btn" style={{ background: '#e3eafc', color: '#1976d2', fontWeight: 'bold', width: 'auto', minWidth: 0, padding: '8px 12px', whiteSpace: 'nowrap' }}>⬅️ Quay lại bước nhập/chọn link</button>
                        </div>
                    )}
                    {step === 3 && quizMode && (
                        <div>
                            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                            <button
                                // className="panel-btn" 
                                style={{
                                    background: '#e3eafc',
                                    color: '#1976d2',
                                    fontWeight: 'bold',
                                    margin: '0 auto 16px 0',
                                    display: 'block',
                                    textAlign: 'left',
                                    width: 'auto',
                                    minWidth: 0,
                                    padding: '8px 12px',
                                    whiteSpace: 'nowrap'
                                }}
                                onClick={handleBackStep}
                            >
                                ⬅️ Quay lại
                            </button>
                            {quizMode && currentList.length > 0 && currentWord && (
                                <div style={{ background: '#f9f9f9', borderRadius: 12, padding: 16, marginTop: 8, position: 'relative' }}>
                                    {/* Hiển thị tổng số từ cần học ở góc phải */}
                                    <div style={{ position: 'absolute', top: 12, right: 18, fontWeight: 'bold', color: '#555', fontSize: 15 }}>
                                        Số từ cần học: {currentList.length - learnedToday.length}
                                        {isReviewingUnknown && <span style={{ color: '#f44336' }}>(Chưa thuộc)</span>}
                                    </div>
                                    <div style={{ marginTop: 24, textAlign: 'right', fontWeight: 'bold', color: '#555', fontSize: 15 }}>
                                        Đã học hôm nay: {learnedToday.length}
                                    </div>
                                </div>)}
                            </div>

                            {quizMode && currentList.length > 0 && currentWord && (
                                <div style={{ background: '#f9f9f9', borderRadius: 12, padding: 16, marginTop: 8, position: 'relative' }}>
                                    {quizMode === 'en-vi' && (
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                            <h2 style={{ fontSize: 28, color: '#2196F3', margin: '16px 0', textAlign: 'center' }}>{currentWord.english}</h2>
                                            {/* Nếu là tiếng Trung thì hiển thị Pinyin ở cột B, ngược lại hiển thị loại từ */}
                                            {/\u4e00-\u9fff/.test(currentWord.english) ? (
                                                currentWord.wordType && (
                                                    <div style={{ fontSize: 16, color: '#795548', marginBottom: 8 }}>
                                                        <span>Pinyin: {currentWord.wordType}</span>
                                                    </div>
                                                )
                                            ) : (
                                                currentWord.wordType && (
                                                    <div style={{ fontSize: 16, color: '#795548', marginBottom: 8 }}>
                                                        <span>Loại từ: {currentWord.wordType}</span>
                                                    </div>
                                                )
                                            )}
                                            {showVietnamese && (
                                                <div style={{ marginTop: 8, fontWeight: 'bold', color: '#2196F3', fontSize: 20 }}>
                                                    Nghĩa: {currentWord.vietnamese}
                                                </div>
                                            )}
                                            {showVietnamese && currentWord.example && (
                                                <div style={{ fontSize: 16, color: '#607d8b', marginTop: 6, fontStyle: 'italic' }}>
                                                    Ví dụ: {currentWord.example}
                                                </div>
                                            )}
                                            <div style={{ marginTop: 12 }}>
                                                <input
                                                    type="text"
                                                    value={inputChinese}
                                                    onChange={e => setInputChinese(e.target.value)}
                                                    placeholder="Nhập nghĩa tiếng Việt..."
                                                    style={{ width: '100%', boxSizing: 'border-box', padding: '10px 14px', borderRadius: 8, border: '2px solid #2196F3', fontSize: '1.08rem', marginRight: 0, outline: 'none', marginBottom: 2 }}
                                                    onKeyDown={e => {
                                                        if (e.key === 'Enter') {
                                                            let isCorrect = false;
                                                            if (quizMode === 'en-vi') {
                                                                isCorrect = inputChinese.trim().toLowerCase() === currentWord.vietnamese.trim().toLowerCase();
                                                            } else if (quizMode === 'vi-en') {
                                                                isCorrect = inputChinese.trim().toLowerCase() === currentWord.english.trim().toLowerCase();
                                                            }
                                                            setShowVietnamese(true); // Luôn hiển thị nghĩa và ví dụ
                                                            // Luôn đọc từ
                                                            const isChinese = /[\u4e00-\u9fff]/.test(currentWord.english);
                                                            const text = currentWord.english;
                                                            const lang = isChinese ? 'zh-CN' : 'en-US';
                                                            const utter = new window.SpeechSynthesisUtterance(text);
                                                            utter.lang = lang;
                                                            window.speechSynthesis.speak(utter);
                                                            if (isCorrect) {
                                                                setCheckResult('✅ Đúng!');
                                                                handleCorrect(currentWord); // Tự động sang từ tiếp theo
                                                            } else {
                                                                setCheckResult('❌ Sai! Đáp án đúng: ' + (quizMode === 'en-vi' ? currentWord.vietnamese : currentWord.english));
                                                                // Không chuyển sang từ mới
                                                            }
                                                        }
                                                    }}
                                                />
                                                {checkResult && <div style={{ marginTop: 8, fontWeight: 'bold' }}>{checkResult}</div>}
                                            </div>
                                        </div>
                                    )}
                                    {quizMode === 'vi-en' && (
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                            <h2 style={{ fontSize: 22, color: '#2196F3', margin: '10px 0', textAlign: 'center' }}>Dịch nghĩa: {currentWord.vietnamese}</h2>
                                            {showVietnamese && (
                                                <div style={{ marginTop: 8, fontWeight: 'bold', color: '#2196F3', fontSize: 20 }}>
                                                    Từ: {currentWord.english}
                                                </div>
                                            )}
                                            {showVietnamese && currentWord.example && (
                                                <div style={{ fontSize: 16, color: '#607d8b', marginTop: 6, fontStyle: 'italic' }}>
                                                    Ví dụ: {currentWord.example}
                                                </div>
                                            )}
                                            <div style={{ marginTop: 12 }}>
                                                <input
                                                    type="text"
                                                    value={inputChinese}
                                                    onChange={e => setInputChinese(e.target.value)}
                                                    placeholder="Nhập từ tiếng Anh/Trung ở cột A..."
                                                    style={{ width: '100%', boxSizing: 'border-box', padding: '10px 14px', borderRadius: 8, border: '2px solid #2196F3', fontSize: '1.08rem', marginRight: 0, outline: 'none', marginBottom: 2 }}
                                                    onKeyDown={e => {
                                                        if (e.key === 'Enter') {
                                                            let isCorrect = false;
                                                            if (quizMode === 'en-vi') {
                                                                isCorrect = inputChinese.trim().toLowerCase() === currentWord.vietnamese.trim().toLowerCase();
                                                            } else if (quizMode === 'vi-en') {
                                                                isCorrect = inputChinese.trim().toLowerCase() === currentWord.english.trim().toLowerCase();
                                                            }
                                                            setShowVietnamese(true); // Luôn hiển thị nghĩa và ví dụ
                                                            // Luôn đọc từ
                                                            const isChinese = /[\u4e00-\u9fff]/.test(currentWord.english);
                                                            const text = currentWord.english;
                                                            const lang = isChinese ? 'zh-CN' : 'en-US';
                                                            const utter = new window.SpeechSynthesisUtterance(text);
                                                            utter.lang = lang;
                                                            window.speechSynthesis.speak(utter);
                                                            if (isCorrect) {
                                                                setCheckResult('✅ Đúng!');
                                                                handleCorrect(currentWord); // Tự động sang từ tiếp theo
                                                            } else {
                                                                setCheckResult('❌ Sai! Đáp án đúng: ' + (quizMode === 'en-vi' ? currentWord.vietnamese : currentWord.english));
                                                                // Không chuyển sang từ mới
                                                            }
                                                        }
                                                    }}
                                                />
                                                {checkResult && <div style={{ marginTop: 8, fontWeight: 'bold' }}>{checkResult}</div>}
                                            </div>
                                        </div>
                                    )}
                                    <div className="button-container">
                                        <button onClick={handlePrev} disabled={currentIndex === 0}>⬅️ Từ trước</button>
                                        <button onClick={handleRepeat}>🔄 Nhắc lại</button>
                                        <button onClick={handleNext}>Từ tiếp ➡️</button>
                                        <button onClick={handleRecord} disabled={isRecording}>
                                            {isRecording ? 'Đang ghi...' : '🎤 Ghi âm (kiểm tra)'}
                                        </button>
                                        <button onClick={playCorrectPronunciation}>
                                            🔊 Đọc mẫu
                                        </button>
                                        {recordResult && <div style={{ marginTop: 8, fontWeight: 'bold', color: recordResult.startsWith('✅') ? '#4CAF50' : '#d32f2f' }}>{recordResult}</div>}
                                    </div>
                                </div>
                            )}
                            {/* Phần thống kê học tập */}
                            <div style={{ 
                                marginTop: 30,
                                background: '#fff',
                                borderRadius: 16,
                                padding: 20,
                                boxShadow: '0 2px 12px rgba(33,150,243,0.15)',
                                width: '100%',
                                maxWidth: 800,
                                boxSizing: 'border-box'
                            }}>
                                <h3 style={{ 
                                    color: '#1976d2',
                                    fontSize: '1.4rem',
                                    marginBottom: 20,
                                    textAlign: 'center',
                                    fontWeight: 'bold'
                                }}>
                                    📊 Thống kê học tập
                                </h3>
                                
                                {/* Hiển thị số liệu tổng quan */}
                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                                    gap: 15,
                                    marginBottom: 25,
                                    padding: '0 10px'
                                }}>
                                    <div style={{
                                        background: '#e3f2fd',
                                        padding: '15px',
                                        borderRadius: 12,
                                        textAlign: 'center'
                                    }}>
                                        <div style={{ fontSize: '2rem', color: '#2196F3', fontWeight: 'bold' }}>
                                            {learnedToday.length}
                                        </div>
                                        <div style={{ color: '#1976d2', fontSize: '0.9rem' }}>Từ đã học hôm nay</div>
                                    </div>
                                    <div style={{
                                        background: '#e8f5e9',
                                        padding: '15px',
                                        borderRadius: 12,
                                        textAlign: 'center'
                                    }}>
                                        <div style={{ fontSize: '2rem', color: '#4caf50', fontWeight: 'bold' }}>
                                            {vocabList.length}
                                        </div>
                                        <div style={{ color: '#2e7d32', fontSize: '0.9rem' }}>Tổng số từ cần học</div>
                                    </div>
                                    <div style={{
                                        background: '#fff3e0',
                                        padding: '15px',
                                        borderRadius: 12,
                                        textAlign: 'center'
                                    }}>
                                        <div style={{ fontSize: '2rem', color: '#ff9800', fontWeight: 'bold' }}>
                                            {unknownWords.length}
                                        </div>
                                        <div style={{ color: '#ef6c00', fontSize: '0.9rem' }}>Từ cần ôn tập</div>
                                    </div>
                                </div>

                                {/* Biểu đồ thống kê 7 ngày */}
                                <div style={{ 
                                    marginTop: 20,
                                    background: '#fff',
                                    borderRadius: 12,
                                    padding: 15,
                                    boxSizing: 'border-box'
                                }}>
                                    <div style={{ 
                                        fontSize: '1.1rem',
                                        color: '#1976d2',
                                        marginBottom: 15,
                                        fontWeight: 500,
                                        textAlign: 'center'
                                    }}>
                                        Số từ đã học trong 7 ngày qua
                                    </div>
                                    <canvas id="learnChart" style={{ width: '100%', height: 200 }}></canvas>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    ReactDOM.createRoot(document.getElementById("root")).render(<App />);
    