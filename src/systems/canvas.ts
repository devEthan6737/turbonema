import { createCanvas, loadImage } from "canvas";
import { rarities, RarityMap } from "./Database/interfaces";

export async function createBrainrotCard(name: string, message: string, base64Image: string, rarity: string, level: number) {
    const width = 450;
    const height = 630;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    const rarityColors: Record<string, string> = {
        'very_common': '#7f8c8d',
        'common': '#95a5a6',
        'uncommon': '#2ecc71',
        'rare': '#3498db',
        'epic': '#9b59b6',
        'legendary': '#f1c40f',
        'mythical': '#e67e22',
        'exotic': '#1abc9c',
        'ungenerable': '#34495e',
        'cursed': '#e74c3c'
    };

    const accentColor = rarityColors[rarity] || '#ffffff';

    ctx.fillStyle = '#121212';
    ctx.fillRect(0, 0, width, height);
    const img = await loadImage(`data:image/png;base64,${base64Image}`);
    ctx.drawImage(img, 0, 0, width, 400);

    ctx.font = 'bold 30px sans-serif'; 
    const nameUpper = name.toUpperCase();
    const nameMetrics = ctx.measureText(nameUpper);
    const maxBoxWidth = width - 40; 
    const boxWidth = Math.min(nameMetrics.width + 60, maxBoxWidth);
    const boxX = (width - boxWidth) / 2;
    const boxY = 372;

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.roundRect(boxX, boxY, boxWidth, 55, 12);
    ctx.fill();

    ctx.fillStyle = '#000000';
    ctx.textAlign = 'center';
    ctx.fillText(nameUpper, width / 2, boxY + 38, boxWidth - 20); 

    ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
    ctx.fillRect(0, 435, width, 40);
    ctx.fillStyle = accentColor;
    ctx.font = 'bold 18px sans-serif';
    const rarityText = RarityMap[rarity as rarities].translation.toUpperCase();
    ctx.fillText(`NIVEL: ${level}  |  [ ${rarityText} ]`, width / 2, 462);

    let fontSize = 22;
    if (message.length > 100) {
        const reduction = Math.floor((message.length - 100) / 10);
        fontSize = Math.max(22 - reduction, 12);
    }

    ctx.fillStyle = '#ffffff';
    ctx.font = `italic ${fontSize}px sans-serif`;
    
    const words = message.split(' ');
    let line = '';
    let textY = 510;
    const maxWidth = width - 80;
    const lineHeight = fontSize + 6;

    for (let n = 0; n < words.length; n++) {
        let testLine = line + words[n] + ' ';
        let metrics = ctx.measureText(testLine);
        if (metrics.width > maxWidth && n > 0) {
            ctx.fillText(line, width / 2, textY);
            line = words[n] + ' ';
            textY += lineHeight;
        } else {
            line = testLine;
        }
    }
    ctx.fillText(line, width / 2, textY);

    ctx.strokeStyle = accentColor;
    ctx.lineWidth = 15;
    ctx.strokeRect(0, 0, width, height);

    return canvas.toBuffer('image/png');
}