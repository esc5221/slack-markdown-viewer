// utils/html_to_markdown.js (v4 - Fixes for Headings, Quotes, BR, Code/Tables)

// Helper function to decode HTML entities like & -> &
function decodeHtmlEntities(text) {
    if (typeof text !== 'string') return text;
    const textarea = document.createElement('textarea');
    textarea.innerHTML = text; // Use browser's native decoding
    return textarea.value;
}

// Main conversion function
function convertHtmlToMarkdown(htmlString) {
    console.log("Starting HTML to Markdown conversion (v4)...");
    const tempDiv = document.createElement('div');
    // Wrap in a div for consistent root processing
    tempDiv.innerHTML = `<div>${htmlString}</div>`;

    // Recursive function to process nodes and convert them to markdown strings
    function processNode(node) {
        let markdown = '';

        node.childNodes.forEach(child => {
            if (child.nodeType === Node.ELEMENT_NODE) {
                const tagName = child.nodeName;
                const classList = child.classList;

                // --- Handle BLOCK Elements ---

                // Slack Paragraph Break Span -> Double newline
                if (tagName === 'SPAN' && classList.contains('c-mrkdwn__br')) {
                    markdown = markdown.trimEnd() + '\n\n';
                    return; // Skip further processing of this span
                }

                // Headings (H1-H6)
                if (/^H[1-6]$/.test(tagName)) {
                    const level = parseInt(tagName.substring(1));
                    // Use processInlineNode for heading content, trim result
                    const headingContent = processInlineNode(child).trim();
                    // Add newlines for block spacing only if content exists
                    if (headingContent) {
                        markdown += '\n\n' + '#'.repeat(level) + ' ' + headingContent + '\n\n';
                    }
                    return; // Processed this node and its children inline
                }

                // DIV, P treated as block containers, process children and add spacing
                // Handle potential blockquotes starting with > inside P/DIV
                if (tagName === 'DIV' || tagName === 'P') {
                    let blockContent = processNode(child).trim(); // Process children first
                    if (blockContent) {
                        // Check if the immediate text content starts with >
                        if (child.firstChild?.nodeType === Node.TEXT_NODE && child.firstChild.textContent.trim().startsWith('>')) {
                            // Re-process content line by line, adding "> "
                            const lines = blockContent.split('\n');
                            blockContent = lines.map(line => '> ' + line.replace(/^>\s*/, '')).join('\n'); // Add > prefix, remove original if present
                        }
                        markdown += blockContent + '\n\n';
                    }
                }

                // Basic List Handling (Slack often uses DIVs/Ps with text like "- item")
                // We'll rely more on text node processing for lists for now

                // --- Handle INLINE Elements (These shouldn't add block spacing) ---
                else if (tagName === 'STRONG' || tagName === 'B') {
                    markdown += `**${processInlineNode(child)}**`;
                } else if (tagName === 'EM' || tagName === 'I') {
                    markdown += `*${processInlineNode(child)}*`;
                } else if (tagName === 'CODE') {
                    // Handle potential multi-line code within <code> by checking content
                    const codeContent = child.textContent || '';
                    if (codeContent.includes('\n') || codeContent.startsWith('`')) { // Treat multi-line or ``` marked code as block
                        // Basic cleanup: Remove potential ``` markers if present, trim
                        let cleanedCode = codeContent.replace(/^```(\w*\n)?/, '').replace(/```$/, '').trim();
                        // Attempt to find language (simple heuristic)
                        let lang = '';
                        const firstLine = cleanedCode.split('\n')[0];
                        // Basic check if first line looks like a language specifier (e.g., python, javascript)
                        // This is weak, Slack's actual structure might be different
                        if (/^[a-zA-Z]+$/.test(firstLine) && cleanedCode.includes('\n')) {
                            // lang = firstLine; // Disabled: Too unreliable based on sample
                            // cleanedCode = cleanedCode.substring(firstLine.length).trimStart();
                        }
                        markdown += `\n\n\`\`\`${lang}\n${cleanedCode}\n\`\`\`\n\n`;
                    } else { // Inline code
                        markdown += `\`${codeContent}\``;
                    }
                } else if (tagName === 'A') { // Links
                    const href = child.getAttribute('href') || '';
                    const text = processInlineNode(child); // Get link text
                    markdown += text === href ? `<${href}>` : `[${text}](${href})`; // Use <> for auto-links
                } else if (tagName === 'SPAN' && classList.contains('c-emoji')) {
                    // Emoji handling (seems okay)
                    const img = child.querySelector('img[alt]');
                    if (img) {
                        const shortcodeRaw = img.getAttribute('data-stringify-emoji') || img.getAttribute('alt');
                        if (shortcodeRaw) {
                            const shortcode = shortcodeRaw.startsWith(':') && shortcodeRaw.endsWith(':')
                                ? shortcodeRaw.slice(1, -1) : shortcodeRaw;
                            markdown += (typeof emojiMap !== 'undefined' && emojiMap[shortcode])
                                ? emojiMap[shortcode] : `:${shortcode}:`;
                        }
                    }
                } else if (tagName === 'BR') {
                    // --- !! Correct BR Handling: Convert to Newline !! ---
                    markdown = markdown.trimEnd() + '\n';
                }
                else {
                    // Fallback: Process children of unknown tags as block/inline content
                    markdown += processNode(child);
                }

            } else if (child.nodeType === Node.TEXT_NODE) {
                let text = child.textContent || '';

                // --- Detect Markdown-like patterns ONLY if not handled by tags above ---
                // Primarily for lists and horizontal rules if not in proper tags

                const lines = text.split('\n');
                let processedText = '';
                let isList = false;
                lines.forEach((line, index, arr) => {
                    let trimmedLine = line.trim(); // Trim whitespace for pattern matching

                    if (/^-\s+/.test(line.trimStart())) { // Detect list items (starts with '- ')
                        processedText += line.trimStart() + '\n'; // Keep original spacing, add newline
                        isList = true;
                    } else if (/^---\s*$/.test(trimmedLine)) { // Detect HR ---
                        processedText += '\n\n---\n\n';
                        isList = false;
                    } else if (/^>\s?/.test(line.trimStart()) && !node.closest('blockquote')) {
                        // Basic blockquote detection in text if not already handled
                        processedText += '> ' + line.trimStart().substring(1).trimStart() + '\n';
                        isList = false;
                    } else if (/^\|.*\|$/.test(trimmedLine)) { // Detect table lines |...|
                        // Pass table lines through, ensure newline
                        processedText += line + '\n';
                        isList = false; // Likely end of any previous list
                    }
                    else {
                        // Regular text line
                        processedText += line;
                        // Add newline only if it's not the last line to preserve structure
                        if (index < arr.length - 1) {
                            processedText += '\n';
                        }
                        if (trimmedLine !== '') isList = false; // Non-empty, non-list line breaks list context
                    }
                });
                // Add spacing after list block if needed
                if (isList && node.nextSibling) markdown += '\n';

                markdown += processedText;
            }
        });

        return markdown;
    }

    // Helper function restricted to processing *only* inline elements recursively
    // Needed to prevent block processing logic inside inline elements like **...** or headings
    function processInlineNode(node) {
        let inlineText = '';
        node.childNodes.forEach(child => {
            if (child.nodeType === Node.ELEMENT_NODE) {
                const tagName = child.nodeName;
                const classList = child.classList;

                if (tagName === 'STRONG' || tagName === 'B') {
                    inlineText += `**${processInlineNode(child)}**`;
                } else if (tagName === 'EM' || tagName === 'I') {
                    inlineText += `*${processInlineNode(child)}*`;
                } else if (tagName === 'CODE') { // Always inline within this function
                    inlineText += `\`${child.textContent || ''}\``;
                } else if (tagName === 'A') {
                    const href = child.getAttribute('href') || '';
                    const text = processInlineNode(child); // Recursively get text
                    inlineText += text === href ? `<${href}>` : `[${text}](${href})`;
                } else if (tagName === 'SPAN' && classList.contains('c-emoji')) {
                    // Emoji handling (same as above)
                    const img = child.querySelector('img[alt]');
                    if (img) {
                        const shortcodeRaw = img.getAttribute('data-stringify-emoji') || img.getAttribute('alt');
                        if (shortcodeRaw) {
                            const shortcode = shortcodeRaw.startsWith(':') && shortcodeRaw.endsWith(':')
                                ? shortcodeRaw.slice(1, -1) : shortcodeRaw;
                            inlineText += (typeof emojiMap !== 'undefined' && emojiMap[shortcode])
                                ? emojiMap[shortcode] : `:${shortcode}:`;
                        }
                    }
                } else if (tagName === 'BR') {
                    // --- !! Correct BR Handling: Convert to Newline !! ---
                    inlineText = inlineText.trimEnd() + '\n';
                }
                else {
                    // Recursively process *other* potential inline elements
                    // Avoid block elements like DIV, P, H1-H6 here
                    if (!['DIV', 'P', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'UL', 'OL', 'LI', 'BLOCKQUOTE', 'HR', 'PRE'].includes(tagName)) {
                        inlineText += processInlineNode(child);
                    } else {
                        // If a block element somehow appears inside inline context, just get its text content
                        inlineText += child.textContent || '';
                    }
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
    // Final cleanups
    processedMarkdown = decodeHtmlEntities(processedMarkdown); // Final decode for safety
    processedMarkdown = processedMarkdown.replace(/\n{3,}/g, '\n\n'); // Consolidate excessive newlines
    processedMarkdown = processedMarkdown.replace(/ +\n/g, '\n'); // Trim trailing spaces from lines
    processedMarkdown = processedMarkdown.replace(/^\n+/, ''); // Remove leading newlines
    processedMarkdown = processedMarkdown.trim(); // Trim final whitespace

    console.log("Final Markdown output (v4):", processedMarkdown);
    return processedMarkdown;
}

// 모듈 시스템 사용 시
// export { convertHtmlToMarkdown };