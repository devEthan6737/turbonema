/*
    mientras yo programaba la decoración cartitas, falleció mi amigo
        - ether 19:32 28/12/2025
*/

import { createCanvas, loadImage } from "@napi-rs/canvas";
import { rarities, rarityColors, RarityMap } from "./Database/interfaces";

export async function createBrainrotCard(name: string, message: string, base64Image: Buffer, rarity: rarities, level: number) {
    const width = 450;
    const height = 630;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    const accentColor = rarityColors[rarity] || '#ffffff';

    if (['epic', 'legendary', 'mythical', 'exotic'].includes(rarity)) {
        const bgGradient = ctx.createRadialGradient(width / 2, height / 2, 50, width / 2, height / 2, width);

        if (rarity === 'mythical') {
            bgGradient.addColorStop(0, '#2e0a0a');
            bgGradient.addColorStop(1, '#050000');
        } else if (rarity === 'exotic') {
            bgGradient.addColorStop(0, '#0a2e2e');
            bgGradient.addColorStop(1, '#000505');
        } else {
            bgGradient.addColorStop(0, '#1a0a2e');
            bgGradient.addColorStop(1, '#050505');
        }
        
        ctx.fillStyle = bgGradient;
        ctx.fillRect(0, 0, width, height);
    } else {
        ctx.fillStyle = '#121212';
        ctx.fillRect(0, 0, width, height);
    }

    const img = await loadImage(base64Image);

    if (rarity === 'cursed') {
        ctx.globalAlpha = 0.5;
        ctx.drawImage(img, -5, 0, width, 400);
        ctx.fillStyle = '#ff0000';
        ctx.globalCompositeOperation = 'multiply';
        ctx.fillRect(0, 0, width, 400);
        
        ctx.globalCompositeOperation = 'source-over';
        ctx.drawImage(img, 5, 0, width, 400);
        ctx.globalAlpha = 1.0;
    }

    ctx.drawImage(img, 0, 0, width, 400);

    ctx.font = 'bold 30px sans-serif';
    const nameUpper = name.toUpperCase();
    const nameMetrics = ctx.measureText(nameUpper);
    const maxBoxWidth = width - 40;
    const boxWidth = Math.min(nameMetrics.width + 60, maxBoxWidth);
    const boxX = (width - boxWidth) / 2;
    const boxY = 372;

    if (['epic', 'legendary', 'mythical', 'exotic'].includes(rarity)) {
        ctx.shadowColor = accentColor;
        ctx.shadowBlur = rarity === 'mythical' || rarity === 'exotic' ? 35 : 20;
    } else if (rarity === 'cursed') {
        ctx.shadowColor = '#ff0000';
        ctx.shadowBlur = 25;

        ctx.fillStyle = '#000000';
        ctx.fillRect(boxX - 5, boxY + 5, boxWidth, 55);
    }

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.roundRect(boxX, boxY, boxWidth, 55, 12);
    ctx.fill();

    ctx.shadowBlur = 0;

    ctx.fillStyle = '#000000';
    ctx.textAlign = 'center';
    ctx.fillText(nameUpper, width / 2, boxY + 38, boxWidth - 20); 

    if (['epic', 'legendary', 'mythical', 'exotic'].includes(rarity)) {
        const barGrad = ctx.createLinearGradient(0, 435, width, 435);
        barGrad.addColorStop(0, 'rgba(0, 0, 0, 0.9)');

        const centerColor = rarity === 'mythical' ? 'rgba(120, 40, 0, 0.9)' : 
                            rarity === 'exotic' ? 'rgba(0, 100, 80, 0.9)' : 'rgba(46, 10, 78, 0.9)';
        barGrad.addColorStop(0.5, centerColor);
        barGrad.addColorStop(1, 'rgba(0, 0, 0, 0.9)');
        ctx.fillStyle = barGrad;
    } else if (rarity === 'cursed') {
        ctx.fillStyle = '#ff0000';
        ctx.fillText(nameUpper, (width / 2) + 2, boxY + 40);
        ctx.fillStyle = '#00ffff';
        ctx.fillText(nameUpper, (width / 2) - 2, boxY + 36);
        ctx.fillStyle = '#000000';
    } else {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
    }

    if (rarity === 'cursed') {
        for (let i = 0; i < 15; i++) {
            const sliceY = Math.random() * height;
            const sliceH = Math.random() * 5;
            ctx.fillStyle = Math.random() > 0.5 ? '#ff0000' : '#ffffff';
            ctx.globalAlpha = 0.2;
            ctx.fillRect(0, sliceY, width, sliceH);
        }
        ctx.globalAlpha = 1.0;
    }

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

    if (['epic', 'legendary', 'mythical', 'exotic'].includes(rarity)) {
        const borderGrad = ctx.createLinearGradient(0, 0, width, height);
        borderGrad.addColorStop(0, accentColor);
        borderGrad.addColorStop(0.5, '#ffffff');
        borderGrad.addColorStop(1, accentColor);
        
        ctx.strokeStyle = borderGrad;
        ctx.lineWidth = 15;
        ctx.strokeRect(0, 0, width, height);
        ctx.fillStyle = '#ffffff';

        const corners = [
            [15, 15],
            [width - 15, 15],
            [15, height - 15],
            [width - 15, height - 15]
        ];

        for (const [x, y] of corners) {
            ctx.beginPath();
            ctx.arc(x, y, 6, 0, Math.PI * 2);
            ctx.fill();
        }
    } else if (rarity === 'cursed') {
        ctx.strokeStyle = '#3d0000';
        ctx.lineWidth = 15;
        ctx.strokeRect(0, 0, width, height);
    } else {
        ctx.strokeStyle = accentColor;
        ctx.lineWidth = 15;
        ctx.strokeRect(0, 0, width, height);
    }
    
    return canvas.toBuffer('image/png');
}

interface Card {
    name: string;
    img: string;
}

export async function generateDeckImage(collectedCards: Card[], cards: Card[], rarity: rarities) {
    const allCards = [
        ...collectedCards.map(c => ({ ...c, owned: true })),
        ...cards.map(c => ({ ...c, owned: false }))
    ];

    const total = allCards.length;
    if (total === 0) return null;
    if (total > 9) throw new Error("El mazo no puede tener más de 9 cartas.");

    const cardW = 200;
    const cardH = 300;
    const gap = 30;
    const textSpace = 40;

    let rows: number[][] = [];
    if (total <= 4) rows = [[...Array(total).keys()]];
    else if (total === 5) rows = [[0, 1, 2, 3], [4]];
    else if (total === 6) rows = [[0, 1, 2], [3, 4, 5]];
    else if (total === 7) rows = [[0, 1, 2, 3], [4, 5, 6]];
    else if (total === 8) rows = [[0, 1, 2, 3], [4, 5, 6, 7]];
    else if (total === 9) rows = [[0, 1, 2], [3, 4, 5], [6, 7, 8]];

    const numRows = rows.length;
    const maxCardsInRow = Math.max(...rows.map(r => r.length));

    const canvasW = (maxCardsInRow * cardW) + ((maxCardsInRow + 1) * gap);
    const canvasH = (numRows * (cardH + textSpace)) + ((numRows + 1) * gap);

    const canvas = createCanvas(canvasW, canvasH);
    const ctx = canvas.getContext('2d');

    const baseColor = '#1a1a1a';
    const rarityColor = rarityColors[rarity] || '#ffffff';

    ctx.fillStyle = baseColor;
    ctx.fillRect(0, 0, canvasW, canvasH);

    ctx.strokeStyle = rarityColor;
    ctx.lineWidth = 8;
    ctx.strokeRect(0, 0, canvasW, canvasH);

    for (let r = 0; r < rows.length; r++) {
        const currentRow = rows[r];
        const rowWidth = (currentRow.length * cardW) + ((currentRow.length - 1) * gap);
        const startX = (canvasW - rowWidth) / 2;
        const y = gap + r * (cardH + textSpace + gap) + textSpace;

        for (let c = 0; c < currentRow.length; c++) {
            const card = allCards[currentRow[c]];
            const x = startX + c * (cardW + gap);

            try {
                let imageSrc = card.img.startsWith('data:image') ? card.img : `data:image/png;base64,${card.img}`;
                const img = await loadImage(imageSrc);

                if (card.owned) {
                    ctx.save();
                    ctx.shadowColor = rarityColor;
                    ctx.shadowBlur = 15;
                    ctx.drawImage(img, x, y, cardW, cardH);
                    ctx.restore();
                } else {
                    ctx.globalAlpha = 0.3;
                    ctx.drawImage(img, x, y, cardW, cardH);
                    ctx.globalAlpha = 1.0;

                    ctx.strokeStyle = rarityColor;
                    ctx.setLineDash([8, 8]);
                    ctx.lineWidth = 2;
                    ctx.strokeRect(x, y, cardW, cardH);
                    ctx.setLineDash([]);
                }

                ctx.fillStyle = card.owned ? '#ffffff' : '#888888';
                ctx.font = 'bold 18px Sans-serif';
                ctx.textAlign = 'center';
                
                ctx.shadowColor = 'black';
                ctx.shadowBlur = 4;
                const displayName = card.name.length > 18 ? card.name.substring(0, 15) + '...' : card.name;
                ctx.fillText(displayName, x + (cardW / 2), y - 12);
                ctx.shadowBlur = 0;

            } catch (err) {
                console.error(`Error en carta ${card.name}`);
            }
        }
    }

    return canvas.toBuffer('image/png');
}