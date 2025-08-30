const { useState, useEffect } = React;

function App() {
    const [sheetLink, setSheetLink] = useState("");
    const [vocabList, setVocabList] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [showVietnamese, setShowVietnamese] = useState(false);

    const convertToCsvLink = (link) => {
        return link.replace("/pubhtml", "/pub?output=csv");
    };

    const fetchVocabulary = async (csvUrl) => {
        try {
            const res = await fetch(csvUrl);
            const text = await res.text();
            const lines = text.split("\n").slice(1);
            const list = lines.map(line => {
                const parts = line.split(",");
                if (parts.length >= 2) {
                    return { english: parts[0].trim(), vietnamese: parts[1].trim() };
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

    const handleNext = () => {
        setCurrentIndex((prev) => (prev + 1) % vocabList.length);
        setShowVietnamese(false);
    };

    const handlePrev = () => {
        setCurrentIndex((prev) => Math.max(prev - 1, 0));
        setShowVietnamese(false);
    };

    const handleRepeat = () => {
        if (!vocabList.length) return;
        const offset = Math.floor(Math.random() * 8) + 3;
        const insertIndex = Math.min(currentIndex + offset, vocabList.length);
        const newList = [...vocabList];
        newList.splice(insertIndex, 0, vocabList[currentIndex]);
        setVocabList(newList);
        setCurrentIndex(currentIndex + 1);
        setShowVietnamese(false);
    };

    const currentWord = vocabList[currentIndex];

    return (
        <div className="container">
            <h1>Vocabulary App</h1>
            <input
                type="text"
                placeholder="Nhập link Google Sheets"
                value={sheetLink}
                onChange={(e) => setSheetLink(e.target.value)}
            />
            <button onClick={handleLoad}>Load dữ liệu</button>

            {vocabList.length > 0 && (
                <div>
                    <p>Tổng số từ trong sheet: {vocabList.length}</p>
                    <h2>{currentWord.english}</h2>
                    {showVietnamese && <h3 style={{ color: "blue" }}>{currentWord.vietnamese}</h3>}

                    <button onClick={() => setShowVietnamese(true)}>Hiển thị nghĩa</button>
                    <div>
                        <button onClick={handlePrev} disabled={currentIndex === 0}>⬅️ Từ trước</button>
                        <button onClick={handleNext}>Từ tiếp theo ➡️</button>
                    </div>
                    <button onClick={handleRepeat}>🔄 Nhắc lại</button>
                </div>
            )}
        </div>
    );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
