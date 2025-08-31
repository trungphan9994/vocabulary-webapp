const { useState, useEffect } = React;

function App() {
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

    const handleNext = () => { setCurrentIndex((prev) => (prev + 1) % currentList.length); setShowVietnamese(false); };
    const handlePrev = () => { setCurrentIndex((prev) => Math.max(prev - 1, 0)); setShowVietnamese(false); };
    const handleRepeat = () => {
        if (!currentList.length) return;
        const offset = Math.floor(Math.random() * 8) + 3;
        const insertIndex = Math.min(currentIndex + offset, currentList.length);
        const newList = [...currentList];
        newList.splice(insertIndex, 0, currentList[currentIndex]);
        setVocabList(newList);
        setCurrentIndex(currentIndex + 1);
        setShowVietnamese(false);
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

    const currentList = isReviewingUnknown ? unknownWords : vocabList;
    const currentWord = currentList[currentIndex];

    return (
        <div className="container">
            <h1 style={{color:'#2196F3', marginBottom:20}}>📚 Vocabulary App</h1>
            {step === 1 && (
                <div style={{margin:'32px 0', textAlign:'center'}}>
                    <div style={{marginBottom:'18px', fontSize:'1.1rem', color:'#1976d2', fontWeight:'bold', letterSpacing:'0.5px'}}>
                        👉 Bước 1: Nhập link Google Sheet hoặc chọn link đã lưu
                    </div>
                    <div style={{maxWidth:400, margin:'0 auto'}}>
                        <input
                            type="text"
                            value={sheetLink}
                            onChange={e => setSheetLink(e.target.value)}
                            placeholder="Dán link Google Sheet..."
                            className="panel-input"
                            style={{marginBottom:12}}
                        />
                        <input
                            type="text"
                            value={newTitle}
                            onChange={e => setNewTitle(e.target.value)}
                            placeholder="Nhập tiêu đề cho link..."
                            className="panel-input"
                            style={{marginBottom:12}}
                        />
                        <div className="panel-btn-group" style={{marginBottom:12}}>
                            <button onClick={handleSaveLinkAndNext} className="panel-btn main">💾 Lưu & Tiếp tục</button>
                            <button onClick={() => setStep(2)} className="panel-btn">Tiếp tục không lưu</button>
                        </div>
                        {savedLinks.length > 0 && (
                            <div style={{marginBottom:12}}>
                                <label className="panel-label">Chọn link đã lưu</label>
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
                                {sheetLink && (
                                    <button 
                                        className="panel-btn main" 
                                        style={{marginTop:8}} 
                                        onClick={() => setStep(2)}
                                    >Tiếp tục với link đã chọn</button>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}
            {step === 2 && (
                <div style={{margin:'32px 0', textAlign:'center'}}>
                    <div style={{marginBottom:'18px', fontSize:'1.1rem', color:'#1976d2', fontWeight:'bold', letterSpacing:'0.5px'}}>
                        👉 Bước 2: Chọn kiểu học
                    </div>
                    <div style={{display:'flex', justifyContent:'center', gap:'24px', marginBottom:'18px'}}>
                        <button 
                            onClick={()=>handleSelectQuizMode('vi-en')} 
                            style={{background:'#2196F3', color:'#fff', fontWeight:'bold', padding:'14px 32px', borderRadius:12, fontSize:'1.08rem', boxShadow:'0 2px 8px rgba(33,150,243,0.10)', border:'none', transition:'0.2s'}}>
                            Từ Việt sang Tiếng
                        </button>
                        <button 
                            onClick={()=>handleSelectQuizMode('en-vi')} 
                            style={{background:'#4CAF50', color:'#fff', fontWeight:'bold', padding:'14px 32px', borderRadius:12, fontSize:'1.08rem', boxShadow:'0 2px 8px rgba(76,175,80,0.10)', border:'none', transition:'0.2s'}}>
                            Từ Tiếng sang Việt
                        </button>
                    </div>
                    <button onClick={handleBackStep} className="panel-btn" style={{background:'#e3eafc', color:'#1976d2', fontWeight:'bold'}}>⬅️ Quay lại bước nhập/chọn link</button>
                </div>
            )}
            {step === 3 && quizMode && (
                <div>
                    <button 
                        className="panel-btn" 
                        style={{background:'#e3eafc', color:'#1976d2', fontWeight:'bold', marginBottom:16}} 
                        onClick={handleBackStep}
                    >⬅️ Quay lại chọn kiểu học</button>
                    {quizMode && currentList.length > 0 && currentWord && (
                        <div style={{background:'#f9f9f9', borderRadius:12, padding:16, marginTop:8}}>
                            <p style={{fontWeight:'bold', color:'#555'}}>
                                Tổng số từ: {currentList.length} {isReviewingUnknown && <span style={{color:'#f44336'}}>(Chưa thuộc)</span>}
                            </p>
                            {quizMode === 'en-vi' && (
                                <div>
                                    <h2 style={{fontSize:28, color:'#333', margin:'16px 0'}}>{currentWord.english}</h2>
                                    {/* Nếu là tiếng Trung thì hiển thị Pinyin ở cột B, ngược lại hiển thị loại từ */}
                                    {/\u4e00-\u9fff/.test(currentWord.english) ? (
                                        currentWord.wordType && (
                                            <div style={{fontSize:16, color:'#795548', marginBottom:8}}>
                                                <span>Pinyin: {currentWord.wordType}</span>
                                            </div>
                                        )
                                    ) : (
                                        currentWord.wordType && (
                                            <div style={{fontSize:16, color:'#795548', marginBottom:8}}>
                                                <span>Loại từ: {currentWord.wordType}</span>
                                            </div>
                                        )
                                    )}
                                    {showVietnamese && (
                                        <div style={{marginTop:8, fontWeight:'bold', color:'#2196F3', fontSize:20}}>
                                            Nghĩa: {currentWord.vietnamese}
                                        </div>
                                    )}
                                    {showVietnamese && currentWord.example && (
                                        <div style={{fontSize:16, color:'#607d8b', marginTop:6, fontStyle:'italic'}}>
                                            Ví dụ: {currentWord.example}
                                        </div>
                                    )}
                                    <div style={{marginTop:12}}>
                                        <input
                                            type="text"
                                            value={inputChinese}
                                            onChange={e => setInputChinese(e.target.value)}
                                            placeholder="Nhập nghĩa tiếng Việt..."
                                            style={{width:'70%', marginRight:8}}
                                        />
                                        <button onClick={() => {
                                            if (inputChinese.trim().toLowerCase() === currentWord.vietnamese.trim().toLowerCase()) {
                                                setCheckResult('✅ Đúng!');
                                            } else {
                                                setCheckResult('❌ Sai! Đáp án đúng: ' + currentWord.vietnamese);
                                            }
                                        }} style={{background:'#ff9800', fontWeight:'bold'}}>Kiểm tra</button>
                                        {checkResult && <div style={{marginTop:8, fontWeight:'bold'}}>{checkResult}</div>}
                                    </div>
                                </div>
                            )}
                            {quizMode === 'vi-en' && (
                                <div>
                                    <h2 style={{fontSize:22, color:'#2196F3', margin:'10px 0'}}>Dịch nghĩa: {currentWord.vietnamese}</h2>
                                    {showVietnamese && (
                                        <div style={{marginTop:8, fontWeight:'bold', color:'#2196F3', fontSize:20}}>
                                            Từ: {currentWord.english}
                                        </div>
                                    )}
                                    {showVietnamese && currentWord.example && (
                                        <div style={{fontSize:16, color:'#607d8b', marginTop:6, fontStyle:'italic'}}>
                                            Ví dụ: {currentWord.example}
                                        </div>
                                    )}
                                    <div style={{marginTop:12}}>
                                        <input
                                            type="text"
                                            value={inputChinese}
                                            onChange={e => setInputChinese(e.target.value)}
                                            placeholder="Nhập từ tiếng Anh/Trung ở cột A..."
                                            style={{width:'70%', marginRight:8}}
                                        />
                                        <button onClick={() => {
                                            if (inputChinese.trim().toLowerCase() === currentWord.english.trim().toLowerCase()) {
                                                setCheckResult('✅ Đúng!');
                                            } else {
                                                setCheckResult('❌ Sai! Đáp án đúng: ' + currentWord.english);
                                            }
                                        }} style={{background:'#ff9800', fontWeight:'bold'}}>Kiểm tra</button>
                                        {checkResult && <div style={{marginTop:8, fontWeight:'bold'}}>{checkResult}</div>}
                                    </div>
                                </div>
                            )}
                            <div className="button-row" style={{margin:'12px 0'}}>
                                <button 
                                    onClick={() => setShowVietnamese(v => !v)} 
                                    style={{background:'#2196F3', color: "#000"}}
                                >{showVietnamese ? 'Ẩn nghĩa' : 'Hiển thị nghĩa'}</button>
                                <button onClick={handleUnknown} style={{background:'#f44336', color: "#000"}}>Chưa thuộc</button>
                                <button onClick={() => {
                                    if (currentWord) {
                                        // Nếu từ tiếng Anh chứa ký tự tiếng Trung thì đọc tiếng Trung, ngược lại đọc tiếng Anh
                                        const isChinese = /[\u4e00-\u9fff]/.test(currentWord.english);
                                        const text = isChinese ? currentWord.english : currentWord.english;
                                        const lang = isChinese ? 'zh-CN' : 'en-US';
                                        const utter = new window.SpeechSynthesisUtterance(text);
                                        utter.lang = lang;
                                        window.speechSynthesis.speak(utter);
                                    }
                                }} style={{background:'#8bc34a', color: "#000"}}>🔊 Đọc từ</button>
                            </div>

                            <div className="button-row">
                                <button style={{color: "#000"}} onClick={handlePrev} disabled={currentIndex === 0}>⬅️ Từ trước</button>
                                <button style={{color: "#000"}}  onClick={handleNext}>Từ tiếp theo ➡️</button>
                            </div>
                        </div>
                    )}

                    <div className="button-row" style={{marginTop:8, color: "#000", display:'flex', gap:'12px'}}>
                        <button onClick={handleRepeat}>🔄 Nhắc lại</button>
                        <button onClick={handleReviewUnknown} disabled={unknownWords.length === 0} style={{background:'#ff9800',color: "#000"}}>Học lại từ chưa thuộc</button>
                        {isReviewingUnknown && <button onClick={handleBackToAll} style={{background:'#4CAF50',color: "#000"}}>Quay lại tất cả</button>}
                    </div>
                </div>
            )}
        </div>
    );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
