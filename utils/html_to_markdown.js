// utils/html_to_markdown.js (v3.1 - Quote and BR fixes)

// Helper function to decode HTML entities like & -> &
function decodeHtmlEntities(text) {
    if (typeof text !== 'string') return text;
    const textarea = document.createElement('textarea');
    textarea.innerHTML = text;
    return textarea.value;
}

// Helper function to escape special characters for placing inside <pre><code>
function escapeHtmlForCode(text) {
    // Escape HTML special chars to prevent them from being interpreted as HTML
    // when we put the text content back into the DOM for final processing.
    // Adjusted to escape & first, then < and >
    return text.replace(/&/g, "&") // Escape & first
               .replace(/</g, "<")
               .replace(/>/g, ">")
               .replace(/"/g, '"')
               .replace(/'/g, "'");
}


// Main conversion function (v3.1 - Quote and BR fixes)
function convertHtmlToMarkdown(htmlString) {
    console.log("Starting HTML to Markdown conversion (v3.1)...");
    const tempDiv = document.createElement('div');
    // Wrap in a div for consistent root processing
    tempDiv.innerHTML = `<div>${htmlString}</div>`;

    // Recursive function to process nodes and convert them to markdown strings
    function processNode(node) {
        let markdown = ''; // Accumulates markdown for the current node and its children

        node.childNodes.forEach(child => {
            if (child.nodeType === Node.ELEMENT_NODE) {
                const tagName = child.nodeName;

                // --- Handle BLOCK Elements ---
                // Slack Paragraph Break Span -> Double newline
                if (tagName === 'SPAN' && child.classList.contains('c-mrkdwn__br')) {
                    markdown = markdown.trimEnd() + '\n\n'; // Ensure paragraph break
                    return; // Skip further processing of this span
                }

                // DIV, P treated as block containers, process children and add spacing
                if (tagName === 'DIV' || tagName === 'P') {
                    const childMarkdown = processNode(child).trim();
                    if (childMarkdown) { // Only add spacing if there's content
                        markdown += childMarkdown + '\n\n';
                    }
                }
                // Add rules for UL, OL, LI, BLOCKQUOTE if Slack generates these tags

                // --- Handle INLINE Elements ---
                else if (tagName === 'STRONG' || tagName === 'B') {
                    markdown += `**${processInlineNode(child)}**`;
                } else if (tagName === 'EM' || tagName === 'I') {
                    markdown += `*${processInlineNode(child)}*`;
                } else if (tagName === 'CODE') { // Inline code
                    markdown += `\`${child.textContent || ''}\``;
                } else if (tagName === 'A') { // Links
                    const href = child.getAttribute('href') || '';
                    const text = processInlineNode(child);
                    if (child.classList.contains('c-mention')) {
                        markdown += text;
                    } else {
                        markdown += `[${text}](${href})`;
                    }
                } else if (tagName === 'SPAN' && child.classList.contains('c-emoji')) {
                    const img = child.querySelector('img[alt^=":"][alt$=":"]');
                    if (img) { // Check if img exists
                        // Prefer data-stringify-emoji if available, otherwise use alt
                        const shortcodeRaw = img.getAttribute('data-stringify-emoji') || img.getAttribute('alt');
                        if (shortcodeRaw) {
                            const shortcode = shortcodeRaw.startsWith(':') && shortcodeRaw.endsWith(':')
                                            ? shortcodeRaw.slice(1, -1) // Remove colons
                                            : shortcodeRaw; // Use as is if no colons
                             markdown += (typeof emojiMap !== 'undefined' && emojiMap[shortcode])
                                        ? emojiMap[shortcode]
                                        : `:${shortcode}:`; // Fallback to :shortcode: format
                        }
                    }
                 } else if (tagName === 'BR') {
                    // --- !! BR 처리 개선: 항상 \n 추가 !! ---
                    // Add a newline. Let Marked.js (with breaks:true) handle rendering.
                    // Trim trailing spaces before adding newline to prevent '  \n' if not intended.
                    markdown = markdown.trimEnd() + '<br/>';
                 }
                 else {
                    // Treat other unrecognized elements as containers for inline content
                    markdown += processInlineNode(child);
                }

            } else if (child.nodeType === Node.TEXT_NODE) {
                let text = child.textContent || '';

                // --- Detect and Process Markdown-like text patterns within text nodes ---

                // 1. Code Blocks (```...```) -> Use placeholders for later restoration
                 const codeBlockRegex = /```(?:([a-zA-Z0-9]*)(?:\n|\s*\n))?([\s\S]*?)```/g;
                 text = text.replace(codeBlockRegex, (match, language, codeContent) => {
                     const langStr = language ? language.trim() : '';
                     const escapedContent = escapeHtmlForCode(codeContent.trim());
                     return `\n\n%%%CODEBLOCK%%%${langStr}%%%${escapedContent}%%%CODEBLOCK%%%\n\n`;
                 });

                 // 2. Tables (|...|) -> Use placeholders
                 const tableRegex = /(?:^|\n)(\|.*?\|(?:\n\|.*\|)+)/g;
                 text = text.replace(tableRegex, (match, tableContent) => {
                     const cleanedContent = tableContent.trim().replace(/<br\s*\/?>/gi, '\n'); // Clean internal BRs if any
                     const escapedContent = escapeHtmlForCode(cleanedContent);
                     return `\n\n%%%TABLE%%%${escapedContent}%%%TABLE%%%\n\n`;
                 });


                 // 3. Headers, Blockquotes, Lists, HR (line start detection)
                 const lines = text.split('\n');
                 let processedText = '';
                 lines.forEach((line, index, arr) => {
                     let trimmedLine = line.trimStart(); // Keep initial spaces for context if needed
                     let originalLine = line; // Keep original for non-matched lines

                     if (/^#{1,6}\s/.test(trimmedLine)) {
                         processedText += `\n\n${trimmedLine}\n\n`; // Add extra spacing
                     } else if (/^>\s?/.test(trimmedLine)) {
                        // --- !! Quote 처리: Markdown > 만 남기고 CSS border로 표시 !! ---
                        // Don't add '>' here, Marked.js will create <blockquote>
                        // Just ensure proper spacing and pass the content
                        const quoteContent = trimmedLine.substring(trimmedLine.indexOf('>') + 1).trimStart();
                         processedText += `\n\n${quoteContent}\n\n`; // Let CSS handle the quote style
                     } else if (/^-\s/.test(trimmedLine)) {
                         processedText += `\n${trimmedLine}`; // Add list item with single newline
                     } else if (/^---\s*$/.test(trimmedLine)) {
                         processedText += '\n\n---\n\n'; // Ensure block separation
                     } else {
                          // Regular text line, preserve original spacing and add newline if needed
                         processedText += originalLine + (index < arr.length - 1 ? '\n' : '');
                     }
                 });
                 markdown += processedText;
            }
        });

        return markdown; // Return accumulated markdown for this node
    }

     // Helper function restricted to processing *only* inline elements recursively
     // Needed to prevent block processing logic inside inline elements like **...**
     function processInlineNode(node) {
        let inlineText = '';
        node.childNodes.forEach(child => {
            if (child.nodeType === Node.ELEMENT_NODE) {
                const tagName = child.nodeName;
                 if (tagName === 'STRONG' || tagName === 'B') {
                    inlineText += `**${processInlineNode(child)}**`;
                 } else if (tagName === 'EM' || tagName === 'I') {
                    inlineText += `*${processInlineNode(child)}*`;
                 } else if (tagName === 'CODE') {
                     inlineText += `\`${child.textContent || ''}\``;
                 } else if (tagName === 'A') {
                    const href = child.getAttribute('href') || '';
                    const text = processInlineNode(child);
                    if (child.classList.contains('c-mention')) {
                         inlineText += text;
                     } else {
                         inlineText += `[${text}](${href})`;
                     }
                 } else if (tagName === 'SPAN' && child.classList.contains('c-emoji')) {
                     const img = child.querySelector('img[alt^=":"][alt$=":"]');
                    if (img) {
                        const shortcodeRaw = img.getAttribute('data-stringify-emoji') || img.getAttribute('alt');
                        if (shortcodeRaw) {
                             const shortcode = shortcodeRaw.startsWith(':') && shortcodeRaw.endsWith(':')
                                             ? shortcodeRaw.slice(1, -1)
                                             : shortcodeRaw;
                             inlineText += (typeof emojiMap !== 'undefined' && emojiMap[shortcode])
                                         ? emojiMap[shortcode]
                                         : `:${shortcode}:`;
                        }
                    }
                 } else if (tagName === 'BR') {
                    // --- !! BR 처리 개선: 항상 \n 추가 !! ---
                    inlineText = inlineText.trimEnd() + '\n';
                 }
                 else {
                    // Recursively process *other* potential inline elements if needed
                    inlineText += processInlineNode(child);
                }
            } else if (child.nodeType === Node.TEXT_NODE) {
                inlineText += child.textContent || '';
            }
        });
        return inlineText;
    }

    // --- Start Processing ---
    let processedMarkdown = processNode(tempDiv.firstChild); // Process the wrapper div

    // --- Post Processing ---
    // Restore placeholders for code blocks and tables
    processedMarkdown = processedMarkdown.replace(/%%%CODEBLOCK%%%([a-zA-Z0-9]*)%%%([\s\S]*?)%%%CODEBLOCK%%%/g, (match, lang, code) => {
        // Decode the escaped HTML within the code block before wrapping in markdown backticks
        return `\n\n\`\`\`${lang || ''}\n${decodeHtmlEntities(code).trim()}\n\`\`\`\n\n`;
    });
    processedMarkdown = processedMarkdown.replace(/%%%TABLE%%%([\s\S]*?)%%%TABLE%%%/g, (match, table) => {
        // Decode the escaped HTML for the table content
        return `\n\n${decodeHtmlEntities(table).trim()}\n\n`;
    });

    // Final cleanups
    processedMarkdown = decodeHtmlEntities(processedMarkdown); // Final decode for any remaining entities
    processedMarkdown = processedMarkdown.replace(/\n{3,}/g, '\n\n'); // Consolidate excessive newlines
    processedMarkdown = processedMarkdown.replace(/ +\n/g, '\n'); // Trim trailing spaces from lines
    processedMarkdown = processedMarkdown.replace(/^\n+/, ''); // Remove leading newlines
    processedMarkdown = processedMarkdown.trim(); // Trim final whitespace

    console.log("Final Markdown output (v3.1):", processedMarkdown);
    return processedMarkdown;
}

// 모듈 시스템 사용 시
// export { convertHtmlToMarkdown };