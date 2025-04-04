// content_script.js
console.log("Slack Markdown Viewer content script v1.2 loaded.");

// 전역 변수로 모달 상태 및 요소 관리
let modalElement = null;
let modalStyleElement = null;
let currentTheme = 'light'; // 기본 테마

// 아이콘 SVG (Lucide 사용)
const viewIconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-book-open"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>`;
const moonIconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-moon"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>`;
const sunIconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-sun"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>`;
const closeIconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-x"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>`;

// --- !! 최종 수정된 modalCss (v3) !! ---
// 프로토타입과 ChatGPT 스타일을 조합하여 문제점 해결 및 디자인 개선
const modalCss = `
/* --- 기본 모달 레이아웃 --- */
#slack-md-viewer-modal {
  position: fixed; top: 0; left: 0; width: 100%; height: 100%;
  background-color: rgba(0, 0, 0, 0.7); /* 오버레이 */
  display: flex; align-items: flex-start; justify-content: center;
  z-index: 10000; overflow-y: auto; padding: 0;
  opacity: 0; visibility: hidden; transition: opacity 0.3s ease, visibility 0s linear 0.3s;
  /* 프로토타입/ChatGPT 폰트 스택 조합 */
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol";
  line-height: 1.7; /* 프로토타입 기본 줄간격 */
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
#slack-md-viewer-modal.visible { opacity: 1; visibility: visible; transition: opacity 0.3s ease; }

/* 모달 컨테이너: 프로토타입 body 역할 (배경색 적용) */
#slack-md-viewer-modal .modal-container {
  width: 100%; min-height: 100vh; box-shadow: none; border-radius: 0;
  overflow: visible; display: block; padding: 0; margin: 0 auto;
  transition: background-color 0.3s ease;
  /* 프로토타입 배경색 */
  background-color: #f4f4f5; /* zinc-100 */
  color: #1f2937; /* zinc-900 */
}
#slack-md-viewer-modal.dark .modal-container {
   background-color: #18181b; /* zinc-900 */
   color: #f9fafb; /* zinc-100 */
}

/* 모달 헤더 (버튼 영역) */
#slack-md-viewer-modal .modal-header {
  position: fixed; top: 1rem; right: 1rem; padding: 0;
  border-bottom: none; z-index: 10010;
}
#slack-md-viewer-modal .modal-controls button {
    background: rgba(100, 100, 100, 0.6); border: none; padding: 6px;
    cursor: pointer; color: #ffffff; border-radius: 50%; margin-left: 8px;
    display: inline-flex; align-items: center; justify-content: center;
    box-shadow: 0 1px 3px rgba(0,0,0,0.3); transition: background-color 0.2s ease;
}
#slack-md-viewer-modal .modal-controls button:hover { background-color: rgba(120, 120, 120, 0.8); }
/* 라이트 모드 버튼 */
#slack-md-viewer-modal:not(.dark) .modal-controls button {
     background: rgba(220, 220, 220, 0.8); border-color: rgba(0, 0, 0, 0.1); color: #333333;
}
#slack-md-viewer-modal:not(.dark) .modal-controls button:hover { background-color: rgba(200, 200, 200, 0.9); }


/* 모달 바디: 콘텐츠 영역 레이아웃/패딩 (프로토타입 #html-preview) */
#slack-md-viewer-modal .modal-body {
   display: block !important; width: 100% !important;
   max-width: 768px; /* md */
   margin-left: auto; margin-right: auto;
   padding: 4rem 1rem 5rem 1rem; /* 프로토타입 패딩 */
   height: auto; overflow-y: visible;
   background-color: transparent; border: none; flex-grow: 0;
}

/* 메타 정보 (제목, 날짜) - 프로토타입 스타일 */
#slack-md-viewer-modal #reader-meta {
    margin-bottom: 2rem; padding-bottom: 1rem;
    border-bottom: 1px solid #d1d5db; /* zinc-300 */
}
#slack-md-viewer-modal.dark #reader-meta { border-bottom-color: #3f3f46; /* zinc-700 */ }
#slack-md-viewer-modal #reader-title {
    font-size: 2.25rem; line-height: 2.5rem; font-weight: 700;
    margin-bottom: 0.5rem; color: #111827; /* zinc-900 */
}
#slack-md-viewer-modal.dark #reader-title { color: #f9fafb; /* zinc-100 */ }
#slack-md-viewer-modal #reader-datetime {
    font-size: 0.75rem; line-height: 1rem; text-align: right;
    color: #6b7280; /* zinc-500 */
}
#slack-md-viewer-modal.dark #reader-datetime { color: #9ca3af; /* zinc-400 */ }

/* --- Prose 스타일 (프로토타입 Tailwind Typography 최대한 반영) --- */
#slack-md-viewer-modal .prose {
    color: #374151; /* zinc-700 */
    line-height: 1.7;
    max-width: none;
    font-size: 1rem; /* 기본 16px */
    word-wrap: break-word;
}
#slack-md-viewer-modal.dark .prose {
    color: #d1d5db; /* zinc-300 */
}

#slack-md-viewer-modal .prose p { margin-top: 1.25em; margin-bottom: 1.25em; }

#slack-md-viewer-modal .prose h1,
#slack-md-viewer-modal .prose h2,
#slack-md-viewer-modal .prose h3,
#slack-md-viewer-modal .prose h4,
#slack-md-viewer-modal .prose h5,
#slack-md-viewer-modal .prose h6 {
    margin-top: 1.8em; margin-bottom: 0.8em;
    font-weight: 600; line-height: 1.3; color: #111827; /* zinc-900 */
    /* --- !! 헤딩 하단 보더 제거 !! --- */
    border-bottom: none;
    padding-bottom: 0;
}
#slack-md-viewer-modal.dark .prose h1,
#slack-md-viewer-modal.dark .prose h2,
#slack-md-viewer-modal.dark .prose h3,
#slack-md-viewer-modal.dark .prose h4,
#slack-md-viewer-modal.dark .prose h5,
#slack-md-viewer-modal.dark .prose h6 {
     color: #ffffff; /* white */
}
#slack-md-viewer-modal .prose h1 { font-size: 1.875em; } /* 30px */
#slack-md-viewer-modal .prose h2 { font-size: 1.5em; }    /* 24px */
#slack-md-viewer-modal .prose h3 { font-size: 1.25em; }   /* 20px */
/* ... */

#slack-md-viewer-modal .prose strong { font-weight: 600; color: inherit; }
#slack-md-viewer-modal .prose em { font-style: italic; color: inherit; }

#slack-md-viewer-modal .prose blockquote {
    margin-top: 1.6em; margin-bottom: 1.6em; padding-left: 1em;
    /* --- !! 프로토타입 인용구 스타일 !! --- */
    border-left: 0.25rem solid #d1d5db; /* zinc-300 */
    color: #4b5563; /* zinc-600 */
    font-style: italic; /* 프로토타입은 기울임 */
}
#slack-md-viewer-modal.dark .prose blockquote {
     border-left-color: #3f3f46; /* zinc-700 */
     color: #a1a1aa; /* zinc-400 */
}
/* --- !! blockquote 내부 p 태그 margin 제거 (CSS 충돌 방지) !! --- */
#slack-md-viewer-modal .prose blockquote p {
    margin-top: 0;
    margin-bottom: 0;
}


#slack-md-viewer-modal .prose ul,
#slack-md-viewer-modal .prose ol { margin-top: 1em; margin-bottom: 1em; padding-left: 1.8em; }
#slack-md-viewer-modal .prose li { margin-top: 0.4em; margin-bottom: 0.4em; }
#slack-md-viewer-modal .prose ul > li::marker { color: #9ca3af; } /* zinc-400 */
#slack-md-viewer-modal.dark .prose ul > li::marker { color: #52525b; } /* zinc-600 */
#slack-md-viewer-modal .prose li > p { margin-top: 0.4em; margin-bottom: 0.4em; }

#slack-md-viewer-modal .prose hr {
    margin-top: 2.5em; margin-bottom: 2.5em;
    border-top: 1px solid #e5e7eb; /* zinc-200 */
}
#slack-md-viewer-modal.dark .prose hr { border-top-color: #3f3f46; /* zinc-700 */ }

/* 코드 스타일 (프로토타입 기준) */
#slack-md-viewer-modal .prose code { /* 인라인 코드 */
    font-size: 0.875em; font-weight: 500;
    color: #1e293b; /* zinc-800 */
    background-color: #e5e7eb; /* zinc-200 */
    padding: 0.2em 0.4em; border-radius: 4px;
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
    word-wrap: break-word;
}
#slack-md-viewer-modal.dark .prose code {
    color: #f1f5f9; /* zinc-100 */
    background-color: #3f3f46; /* zinc-700 */
}
#slack-md-viewer-modal .prose code::before,
#slack-md-viewer-modal .prose code::after { content: none; }

#slack-md-viewer-modal .prose pre { /* 코드 블록 */
    font-size: 0.875em; margin-top: 1.6em; margin-bottom: 1.6em;
    border-radius: 8px; padding: 1em 1.2em; overflow-x: auto;
    background-color: #f4f4f5; /* zinc-100 */
    color: #3f3f46; /* zinc-700 */
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
    line-height: 1.5;
}
#slack-md-viewer-modal.dark .prose pre {
    background-color: #18181b; /* zinc-900 */
    color: #d1d5db; /* zinc-300 */
}
#slack-md-viewer-modal .prose pre code {
    background-color: transparent; border-width: 0; border-radius: 0;
    padding: 0; font-weight: inherit; color: inherit; font-size: inherit;
    font-family: inherit; line-height: inherit;
}

/* 테이블 스타일 (프로토타입 기준) */
#slack-md-viewer-modal .prose table {
    font-size: 0.9em; line-height: 1.5; margin-top: 1.6em; margin-bottom: 1.6em;
    width: auto; display: block; overflow-x: auto;
    border-collapse: collapse; border-spacing: 0;
    border: 1px solid #d1d5db; /* zinc-300 */
}
#slack-md-viewer-modal.dark .prose table { border-color: #3f3f46; /* zinc-700 */ }
#slack-md-viewer-modal .prose th,
#slack-md-viewer-modal .prose td {
    padding: 0.6em 0.9em; border: 1px solid #d1d5db; /* zinc-300 */
}
#slack-md-viewer-modal.dark .prose th,
#slack-md-viewer-modal.dark .prose td { border-color: #3f3f46; /* zinc-700 */ }
#slack-md-viewer-modal .prose th {
    font-weight: 600; background-color: #e5e7eb; /* zinc-200 */
}
#slack-md-viewer-modal.dark .prose th { background-color: #27272a; /* zinc-800 */ }
/* 짝수 행 배경 제거 (프로토타입 단순 스타일) */
#slack-md-viewer-modal .prose tr:nth-child(2n) { background-color: transparent; }
#slack-md-viewer-modal:not(.dark) .prose tr:nth-child(2n) { background-color: transparent; }


/* 스크롤바 스타일 (프로토타입 기준) */
#slack-md-viewer-modal::-webkit-scrollbar { width: 8px; height: 8px; }
#slack-md-viewer-modal::-webkit-scrollbar-track { background: #18181b; } /* zinc-900 */
#slack-md-viewer-modal::-webkit-scrollbar-thumb { background: #52525b; border-radius: 4px; } /* zinc-600 */
#slack-md-viewer-modal::-webkit-scrollbar-thumb:hover { background: #71717a; } /* zinc-500 */
#slack-md-viewer-modal:not(.dark)::-webkit-scrollbar-track { background: #f4f4f5; } /* zinc-100 */
#slack-md-viewer-modal:not(.dark)::-webkit-scrollbar-thumb { background: #a1a1aa; } /* zinc-400 */
#slack-md-viewer-modal:not(.dark)::-webkit-scrollbar-thumb:hover { background: #71717a; } /* zinc-500 */

/* 링크 스타일 (프로토타입 기준) */
#slack-md-viewer-modal .prose a {
  color: #111827; /* zinc-900 (라이트) */ text-decoration: underline; font-weight: inherit;
}
#slack-md-viewer-modal.dark .prose a { color: #f9fafb; /* zinc-100 (다크) */ }
#slack-md-viewer-modal .prose a:hover { /* Optional hover */ }

/* --- 최종 CSS 끝 --- */
`;


// ... 나머지 content_script.js 코드 ...

// ... 나머지 content_script.js 코드 (createModal, applyTheme, toggleTheme, updateThemeIcons, showModal, hideModal, manageViewerButton, Observer 등) 는 이전과 동일하게 유지 ...

// --- 모달 생성 함수 수정 ---
function createModal() {
    if (modalElement) return;

    if (!modalStyleElement) {
        modalStyleElement = document.createElement('style');
        modalStyleElement.textContent = modalCss; // enhanced-markdown-editor 스타일 적용
        document.head.appendChild(modalStyleElement);
    }

    // enhanced-markdown-editor의 리더 모드 구조에 맞게 HTML 구조 변경
    modalElement = document.createElement('div');
    modalElement.id = 'slack-md-viewer-modal';
    modalElement.innerHTML = `
        <div class="modal-container">
            <div class="modal-header">
                <div class="modal-controls">
                    <button id="md-viewer-theme-toggle" title="Toggle Theme">
                        ${moonIconSvg}
                        ${sunIconSvg}
                    </button>
                    <button id="md-viewer-close" title="Close">
                        ${closeIconSvg}
                    </button>
                </div>
            </div>
            <div class="modal-body">
                <div id="reader-meta" class="not-prose">
                    <h1 id="reader-title">Loading...</h1>
                    <p id="reader-datetime"></p>
                </div>
                <div id="rendered-markdown" class="prose">
                    <p>Loading content...</p>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(modalElement);

    // --- 이벤트 리스너 연결 ---
    const themeToggleBtn = modalElement.querySelector('#md-viewer-theme-toggle');
    const closeBtn = modalElement.querySelector('#md-viewer-close');

    // 테마 토글 버튼 리스너
    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', toggleTheme);
    } else {
        console.error("Theme toggle button not found in modal.");
    }

    // 닫기 버튼 리스너
    if (closeBtn) {
        closeBtn.addEventListener('click', hideModal);
    } else {
        console.error("Close button not found in modal.");
    }

    // 모달 배경 클릭 시 닫기
    modalElement.addEventListener('click', (event) => {
        if (event.target === modalElement) {
            hideModal();
        }
    });

    // --- 초기 테마 설정 ---
    // 1. 시스템 테마 설정 확인
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    // 2. 로컬 스토리지에서 테마 설정 확인 (localStorage를 안전하게 검사)
    try {
        const savedTheme = localStorage.getItem('slackMarkdownViewerTheme');
        if (savedTheme) {
            currentTheme = savedTheme;
        } else {
            currentTheme = prefersDark ? 'dark' : 'light';
        }
    } catch (e) {
        // localStorage 접근 오류 시 시스템 설정 사용
        currentTheme = prefersDark ? 'dark' : 'light';
    }

    // 3. 초기 테마 적용
    applyTheme(currentTheme);

    // 4. 테마 버튼 아이콘 초기 상태 설정
    updateThemeIcons();

    console.log("Enhanced Reader Mode Modal created and initialized.");
}

// --- 테마 적용 함수 수정 ---
function applyTheme(theme) {
    if (!modalElement) return;
    currentTheme = theme;

    // 모달에 다크 모드 클래스 토글
    if (theme === 'dark') {
        modalElement.classList.add('dark');
    } else {
        modalElement.classList.remove('dark');
    }

    updateThemeIcons();

    // 설정 저장 (localStorage를 안전하게 사용)
    try {
        localStorage.setItem('slackMarkdownViewerTheme', theme);
    } catch (e) {
        console.warn("테마 설정을 저장할 수 없습니다:", e);
    }
}

// --- 테마 토글 함수 ---
function toggleTheme() {
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    applyTheme(newTheme);
}

// --- 테마 아이콘 업데이트 함수 ---
function updateThemeIcons() {
    if (!modalElement) return;
    const themeToggleBtn = modalElement.querySelector('#md-viewer-theme-toggle');
    if (!themeToggleBtn) return;

    // 루시드 아이콘 클래스 대신 직접 SVG 처리
    const moonIcon = themeToggleBtn.querySelector('svg.lucide-moon') || themeToggleBtn.querySelector('svg:first-child');
    const sunIcon = themeToggleBtn.querySelector('svg.lucide-sun') || themeToggleBtn.querySelector('svg:nth-child(2)');

    if (!moonIcon || !sunIcon) {
        console.warn("테마 아이콘을 찾을 수 없습니다.");
        return;
    }

    if (currentTheme === 'dark') {
        moonIcon.style.display = 'none';
        sunIcon.style.display = 'inline-block';
    } else {
        moonIcon.style.display = 'inline-block';
        sunIcon.style.display = 'none';
    }
}

// --- showModal 함수 수정 ---
function showModal(markdownText) {
    if (!modalElement) {
        createModal();
    }
    if (!modalElement) return;

    // reader-meta 영역과 rendered-markdown 영역 선택
    const metaTitleElement = modalElement.querySelector('#reader-title');
    const dateTimeElement = modalElement.querySelector('#reader-datetime');
    const contentElement = modalElement.querySelector('#rendered-markdown');

    try {
        const htmlContent = marked.parse(markdownText);

        // 메타 제목 설정 (파싱된 HTML에서 첫 H1 찾기)
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = htmlContent;
        const firstH1 = tempDiv.querySelector('h1');
        const titleText = firstH1 ? firstH1.textContent : "Slack Message";
        metaTitleElement.textContent = titleText;

        // 날짜/시간 설정 - enhanced-markdown-editor 방식으로 포맷
        const now = new Date();
        const formattedDate = now.toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        const formattedTime = now.toLocaleTimeString('ko-KR', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        });
        dateTimeElement.textContent = `${formattedDate} ${formattedTime}`;

        // 본문 내용 렌더링
        contentElement.innerHTML = htmlContent;

        // 모달 표시 애니메이션
        requestAnimationFrame(() => {
            modalElement.classList.add('visible');
        });

    } catch (error) {
        console.error("마크다운 렌더링 중 오류 발생:", error);
        metaTitleElement.textContent = "Error";
        contentElement.innerHTML = "<p>콘텐츠를 표시할 수 없습니다.</p>";
        requestAnimationFrame(() => {
            modalElement.classList.add('visible');
        });
    }
}

// --- 모달 숨기기 함수 ---
function hideModal() {
    if (!modalElement) return;
    modalElement.classList.remove('visible');
    // 애니메이션 종료 후 DOM에서 제거하지 않고 숨김 상태로 유지
}
// 메시지 요소에 뷰어 버튼 추가/관리
function manageViewerButton(messageElement) {
    // 버튼 생성 함수
    const createButton = () => {
        const button = document.createElement('button');
        button.innerHTML = viewIconSvg;
        button.title = "마크다운으로 보기";
        button.classList.add('markdown-viewer-hover-button');
        button.style.zIndex = '50';

        button.addEventListener('click', (event) => {
            event.stopPropagation();

            const messageTextElement = messageElement.querySelector('[data-qa="message-text"]');
            if (messageTextElement) {
                const messageHtml = messageTextElement.innerHTML;
                try {
                    const markdownText = convertHtmlToMarkdown(messageHtml);
                    showModal(markdownText);
                } catch (error) {
                    console.error("HTML을 마크다운으로 변환 중 오류 발생:", error);
                    alert("메시지를 마크다운으로 변환할 수 없습니다.");
                }
            } else {
                console.error("모달을 위한 메시지 텍스트 요소를 찾을 수 없습니다.");
                alert("메시지 내용을 추출할 수 없습니다.");
            }
        });
        return button;
    };

    // Hover 이벤트 리스너
    messageElement.addEventListener('mouseenter', () => {
        // 버튼이 없으면 생성하고 추가
        if (!messageElement.querySelector('.markdown-viewer-hover-button')) {
            const button = createButton();
            // 메시지 컨테이너를 기준으로 위치 잡기 위해 relative 설정 확인/추가
            if (getComputedStyle(messageElement).position === 'static') {
                messageElement.style.position = 'relative';
            }
            messageElement.appendChild(button);
        }
    });

    messageElement.addEventListener('mouseleave', () => {
        // 마우스가 떠나면 버튼 제거
        const button = messageElement.querySelector('.markdown-viewer-hover-button');
        if (button) {
            button.remove();
        }
    });
}

// MutationObserver 설정
const observer = new MutationObserver(mutations => {
    mutations.forEach(mutation => {
        mutation.addedNodes.forEach(node => {
            if (node.nodeType === Node.ELEMENT_NODE) {
                // 슬랙 메시지 컨테이너 식별자
                const messageSelector = '.c-virtual_list__item[data-item-key]';

                if (node.matches(messageSelector)) {
                    manageViewerButton(node);
                } else {
                    node.querySelectorAll(messageSelector).forEach(manageViewerButton);
                }

                // 메시지 내용이 나중에 로드될 경우 대비
                if (node.matches('[data-qa="message-text"]') || node.querySelector('[data-qa="message-text"]')) {
                    const container = node.closest(messageSelector);
                    if (container && !container.querySelector('.markdown-viewer-hover-button')) {
                        manageViewerButton(container);
                    }
                }
            }
        });
    });
});

// Observer 시작
const targetNode = document.querySelector('.c-virtual_list__scroll_container') || document.body; // 더 구체적인 타겟 시도
if (targetNode) {
    observer.observe(targetNode, { childList: true, subtree: true });
    console.log("MutationObserver started.");

    // 초기 로드된 메시지에도 적용
    document.querySelectorAll('.c-virtual_list__item[data-item-key]').forEach(manageViewerButton);
} else {
    console.error("Could not find target node for MutationObserver.");
}
