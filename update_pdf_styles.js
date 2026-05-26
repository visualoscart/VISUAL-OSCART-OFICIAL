const fs = require('fs');
const path = require('path');

const screensDir = path.join(__dirname, 'screens');
const performancePath = path.join(screensDir, 'Performance.tsx');
const campaignsPath = path.join(screensDir, 'Campaigns.tsx');

function processFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');

    // 1. Remove all 'italic' class names
    content = content.replace(/\bitalic\b/g, '');
    
    // 2. Fix multiple spaces caused by removing 'italic'
    content = content.replace(/ {2,}/g, ' ');
    content = content.replace(/ "/g, '"');
    content = content.replace(/" /g, '"');

    // 3. Dark Theme - Backgrounds & Containers
    content = content.replace(/bg-\[#f8fafc\] text-slate-900/g, 'bg-[#0a0a0a] text-white');
    content = content.replace(/bg-gradient-to-br from-slate-50 to-slate-200/g, 'bg-[#0a0a0a]');
    content = content.replace(/border-\[20px\] border-white/g, 'border-[20px] border-[#0a0a0a]');
    
    // 4. Dark Theme - Text Colors inside PDF (careful to target pdf classes, but replacing globally is okay for slate)
    // Wait, replacing text-slate-900 globally might affect the main UI if it uses it. The UI is dark mode, so it likely uses text-white.
    // Let's replace only within the PDF section if possible, or just globally since the UI is dark mode and probably doesn't use text-slate-900 for dark mode.
    // Actually, UI uses text-white mostly. Let's do a global replace for these specific text colors.
    content = content.replace(/text-slate-900/g, 'text-white');
    content = content.replace(/text-slate-800/g, 'text-slate-100');
    content = content.replace(/text-slate-700/g, 'text-slate-200');
    content = content.replace(/text-slate-600/g, 'text-slate-300');
    content = content.replace(/text-slate-500/g, 'text-slate-400');
    
    // 5. Glassmorphism Cards
    // old: bg-white/60 backdrop-blur-2xl shadow-[0_8px_30px_rgba(0,0,0,0.06)] border border-white
    content = content.replace(/bg-white\/60 backdrop-blur-2xl shadow-\[0_8px_30px_rgba\(0,0,0,0\.06\)\]/g, 'bg-white/[0.03] backdrop-blur-3xl shadow-[0_24px_40px_-12px_rgba(0,0,0,0.5)]');
    content = content.replace(/border border-white/g, 'border border-white/10');
    
    // Other old backgrounds just in case
    content = content.replace(/bg-white border-b-2/g, 'bg-[#0a0a0a] border-b-2');
    content = content.replace(/bg-white flex flex-col/g, 'bg-[#0a0a0a] flex flex-col');
    content = content.replace(/bg-[#dbdbdb]/g, 'bg-white/[0.03]');
    
    // 6. Table Headers / Grid headers
    content = content.replace(/bg-slate-900/g, 'bg-white/[0.08]');
    content = content.replace(/border-slate-100/g, 'border-white/10');
    content = content.replace(/border-slate-200/g, 'border-white/10');
    content = content.replace(/border-slate-300/g, 'border-white/10');
    
    // 7. Pie chart colors in Performance
    content = content.replace(/color: '#0f172a'/g, "color: '#ffffff'");
    content = content.replace(/color: '#64748b'/g, "color: '#475569'");
    content = content.replace(/fill="#0f172a"/g, 'fill="#ffffff"');
    content = content.replace(/fill="#64748b"/g, 'fill="#475569"');

    // 8. Make sure PDF text colors are white
    content = content.replace(/text-slate-900 font-sans/g, 'text-white font-sans');

    // 9. Extra styling for the "wow" glass effect (inner shadow, rounded 3xl)
    // Replace rounded-2xl with rounded-3xl on glass cards
    content = content.replace(/rounded-2xl flex flex-col/g, 'rounded-[2rem] flex flex-col');
    content = content.replace(/rounded-2xl items-center shadow-sm/g, 'rounded-[2rem] items-center shadow-[0_8px_30px_rgba(0,0,0,0.3)]');

    fs.writeFileSync(filePath, content, 'utf8');
}

processFile(performancePath);
processFile(campaignsPath);

console.log("Updated styles successfully!");
