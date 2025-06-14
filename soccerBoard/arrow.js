// Arrowクラス: スタイリッシュな矢印オブジェクト
export class Arrow {
    constructor(startX, startY, endX, endY, options = {}) {
        this.startX = startX;
        this.startY = startY;
        this.endX = endX;
        this.endY = endY;
        this.type = 'arrow';
        
        // デフォルトオプション
        this.color = options.color || 'rgba(239, 83, 80, 0.9)';
        this.style = options.style || 'modern'; // 'modern', 'neon', 'gradient', 'handdrawn', 'metallic'
        this.animated = options.animated || false;
        this.thickness = options.thickness || 1; // 太さの倍率

        // shadowColorが指定されていない場合、本体色から自動生成する
        if (options.shadowColor) {
            this.shadowColor = options.shadowColor;
        } else {
            if (this.color.startsWith('#')) {
                const r = parseInt(this.color.slice(1, 3), 16);
                const g = parseInt(this.color.slice(3, 5), 16);
                const b = parseInt(this.color.slice(5, 7), 16);
                this.shadowColor = `rgba(${r}, ${g}, ${b}, 0.3)`;
            } else {
                this.shadowColor = this.color.replace(/, ([\d\.]+)\)/, ', 0.3)');
            }
        }
    }

    draw(ctx, w, h, time = 0) {
        const startX = this.startX * w;
        const startY = this.startY * h;
        const endX = this.endX * w;
        const endY = this.endY * h;
        
        // 矢印の基本パラメータ
        const length = Math.sqrt((endX - startX) ** 2 + (endY - startY) ** 2);
        const angle = Math.atan2(endY - startY, endX - startX);
        const headlen = Math.min(w, h) * 0.025 * this.thickness;
        const lineWidth = Math.max(2, Math.min(w, h) * 0.006 * this.thickness);
        
        ctx.save();
        
        // スタイルに応じた描画
        switch(this.style) {
            case 'neon':
                this.drawNeonArrow(ctx, startX, startY, endX, endY, angle, headlen, lineWidth, time);
                break;
            case 'gradient':
                this.drawGradientArrow(ctx, startX, startY, endX, endY, angle, headlen, lineWidth);
                break;
            case 'handdrawn':
                this.drawHanddrawnArrow(ctx, startX, startY, endX, endY, angle, headlen, lineWidth);
                break;
            case 'metallic':
                this.drawMetallicArrow(ctx, startX, startY, endX, endY, angle, headlen, lineWidth, time);
                break;
            default:
                this.drawModernArrow(ctx, startX, startY, endX, endY, angle, headlen, lineWidth, time);
        }
        
        ctx.restore();
    }

    drawModernArrow(ctx, startX, startY, endX, endY, angle, headlen, lineWidth, time) {
        // シャドウ効果
        ctx.shadowColor = this.shadowColor;
        ctx.shadowBlur = 8;
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 2;
        
        // 線の描画（端を丸く）
        ctx.strokeStyle = this.color;
        ctx.lineWidth = lineWidth;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        // アニメーション効果
        if (this.animated) {
            const opacity = 0.7 + 0.3 * Math.sin(time * 0.003);
            ctx.globalAlpha = opacity;
        }
        
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX - headlen * 0.8 * Math.cos(angle), endY - headlen * 0.8 * Math.sin(angle));
        ctx.stroke();
        
        // 矢頭（より鋭角でスタイリッシュ）
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.moveTo(endX, endY);
        ctx.lineTo(
            endX - headlen * Math.cos(angle - Math.PI / 8),
            endY - headlen * Math.sin(angle - Math.PI / 8)
        );
        ctx.lineTo(
            endX - headlen * 0.6 * Math.cos(angle),
            endY - headlen * 0.6 * Math.sin(angle)
        );
        ctx.lineTo(
            endX - headlen * Math.cos(angle + Math.PI / 8),
            endY - headlen * Math.sin(angle + Math.PI / 8)
        );
        ctx.closePath();
        ctx.fill();
    }

    drawHanddrawnArrow(ctx, startX, startY, endX, endY, angle, headlen, lineWidth) {
        // 手書き風のランダムさを再現するためのシード値
        const seed = Math.abs(startX + startY + endX + endY) % 1000;
        
        // 手書き風の色（少し薄め）
        ctx.strokeStyle = this.color.replace(/[\d\.]+\)$/, '0.8)');
        ctx.lineWidth = lineWidth * 0.8;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        // 手書き風の線を描画（複数の短い線で構成）
        this.drawRoughLine(ctx, startX, startY, endX - headlen * 0.7 * Math.cos(angle), endY - headlen * 0.7 * Math.sin(angle), seed);
        
        // 手書き風の矢頭
        ctx.fillStyle = this.color.replace(/[\d\.]+\)$/, '0.7)');
        this.drawRoughArrowHead(ctx, endX, endY, angle, headlen, seed);
    }

    drawRoughLine(ctx, x1, y1, x2, y2, seed) {
        const distance = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
        const segments = Math.max(3, Math.floor(distance / 20)); // 線を分割する数
        
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        
        for (let i = 1; i <= segments; i++) {
            const t = i / segments;
            const x = x1 + (x2 - x1) * t;
            const y = y1 + (y2 - y1) * t;
            
            // ランダムな揺らぎを追加（シード値ベース）
            const roughness = 3;
            const offsetX = (this.seededRandom(seed + i * 17) - 0.5) * roughness;
            const offsetY = (this.seededRandom(seed + i * 23) - 0.5) * roughness;
            
            ctx.lineTo(x + offsetX, y + offsetY);
        }
        
        ctx.stroke();
        
        // 手書き感を出すために少し重ねて描く
        ctx.globalAlpha = 0.3;
        ctx.beginPath();
        ctx.moveTo(x1 + (this.seededRandom(seed) - 0.5) * 2, y1 + (this.seededRandom(seed + 1) - 0.5) * 2);
        
        for (let i = 1; i <= segments; i++) {
            const t = i / segments;
            const x = x1 + (x2 - x1) * t;
            const y = y1 + (y2 - y1) * t;
            
            const roughness = 2;
            const offsetX = (this.seededRandom(seed + i * 37) - 0.5) * roughness;
            const offsetY = (this.seededRandom(seed + i * 41) - 0.5) * roughness;
            
            ctx.lineTo(x + offsetX, y + offsetY);
        }
        
        ctx.stroke();
        ctx.globalAlpha = 1;
    }

    drawRoughArrowHead(ctx, x, y, angle, headlen, seed) {
        // 手書き風の矢頭の形状
        const points = [];
        
        // 矢頭の先端
        points.push({
            x: x + (this.seededRandom(seed) - 0.5) * 2,
            y: y + (this.seededRandom(seed + 1) - 0.5) * 2
        });
        
        // 左側の点
        const leftAngle = angle - Math.PI / 6 + (this.seededRandom(seed + 2) - 0.5) * 0.3;
        points.push({
            x: x - headlen * Math.cos(leftAngle) + (this.seededRandom(seed + 3) - 0.5) * 3,
            y: y - headlen * Math.sin(leftAngle) + (this.seededRandom(seed + 4) - 0.5) * 3
        });
        
        // 中央の凹み部分
        const centerX = x - headlen * 0.4 * Math.cos(angle) + (this.seededRandom(seed + 5) - 0.5) * 2;
        const centerY = y - headlen * 0.4 * Math.sin(angle) + (this.seededRandom(seed + 6) - 0.5) * 2;
        points.push({ x: centerX, y: centerY });
        
        // 右側の点
        const rightAngle = angle + Math.PI / 6 + (this.seededRandom(seed + 7) - 0.5) * 0.3;
        points.push({
            x: x - headlen * Math.cos(rightAngle) + (this.seededRandom(seed + 8) - 0.5) * 3,
            y: y - headlen * Math.sin(rightAngle) + (this.seededRandom(seed + 9) - 0.5) * 3
        });
        
        // 手書き風の矢頭を描画
        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        
        for (let i = 1; i < points.length; i++) {
            ctx.lineTo(points[i].x, points[i].y);
        }
        
        ctx.closePath();
        ctx.fill();
        
        // 輪郭を手書き風に描く
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 1;
        ctx.stroke();
    }

    // シード値ベースの疑似ランダム関数（一貫した結果を得るため）
    seededRandom(seed) {
        const x = Math.sin(seed) * 10000;
        return x - Math.floor(x);
    }

    drawMetallicArrow(ctx, startX, startY, endX, endY, angle, headlen, lineWidth, time) {
        // メタリック効果のための基本設定
        const metalType = this.color.includes('gold') ? 'gold' : 
                         this.color.includes('silver') ? 'silver' : 'chrome';
        
        // 線の描画（メタリック効果）
        this.drawMetallicLine(ctx, startX, startY, endX - headlen * 0.7 * Math.cos(angle), endY - headlen * 0.7 * Math.sin(angle), lineWidth, metalType, time);
        
        // メタリック矢頭
        this.drawMetallicArrowHead(ctx, endX, endY, angle, headlen, metalType, time);
    }

    drawMetallicLine(ctx, x1, y1, x2, y2, lineWidth, metalType, time) {
        const angle = Math.atan2(y2 - y1, x2 - x1);
        const length = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
        
        // 光の動き（アニメーション）
        const lightOffset = this.animated ? Math.sin(time * 0.002) * 0.3 : 0;
        
        // メタリックグラデーション作成
        const gradient = this.createMetallicGradient(ctx, x1, y1, x2, y2, metalType, lightOffset);
        
        // 影の描画
        ctx.save();
        ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
        ctx.shadowBlur = 6;
        ctx.shadowOffsetX = 3;
        ctx.shadowOffsetY = 3;
        
        // ベースの線
        ctx.strokeStyle = gradient;
        ctx.lineWidth = lineWidth * 1.5;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
        
        ctx.restore();
        
        // ハイライト効果
        this.drawMetallicHighlight(ctx, x1, y1, x2, y2, lineWidth, metalType, lightOffset);
    }

    drawMetallicArrowHead(ctx, x, y, angle, headlen, metalType, time) {
        const lightOffset = this.animated ? Math.sin(time * 0.002) * 0.3 : 0;
        
        // 矢頭の座標計算
        const tip = { x: x, y: y };
        const left = {
            x: x - headlen * Math.cos(angle - Math.PI / 6),
            y: y - headlen * Math.sin(angle - Math.PI / 6)
        };
        const right = {
            x: x - headlen * Math.cos(angle + Math.PI / 6),
            y: y - headlen * Math.sin(angle + Math.PI / 6)
        };
        const center = {
            x: x - headlen * 0.4 * Math.cos(angle),
            y: y - headlen * 0.4 * Math.sin(angle)
        };
        
        // 影の描画
        ctx.save();
        ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
        ctx.shadowBlur = 6;
        ctx.shadowOffsetX = 3;
        ctx.shadowOffsetY = 3;
        
        // メタリックグラデーション
        const gradient = this.createMetallicGradient(ctx, left.x, left.y, right.x, right.y, metalType, lightOffset);
        ctx.fillStyle = gradient;
        
        // 矢頭の描画
        ctx.beginPath();
        ctx.moveTo(tip.x, tip.y);
        ctx.lineTo(left.x, left.y);
        ctx.lineTo(center.x, center.y);
        ctx.lineTo(right.x, right.y);
        ctx.closePath();
        ctx.fill();
        
        ctx.restore();
        
        // 矢頭のハイライト
        this.drawArrowHeadHighlight(ctx, tip, left, right, center, metalType, lightOffset);
    }

    createMetallicGradient(ctx, x1, y1, x2, y2, metalType, lightOffset) {
        const gradient = ctx.createLinearGradient(x1, y1, x2, y2);
        
        switch(metalType) {
            case 'gold':
                gradient.addColorStop(0, '#B8860B');
                gradient.addColorStop(0.2 + lightOffset, '#FFD700');
                gradient.addColorStop(0.5, '#FFF8DC');
                gradient.addColorStop(0.8 - lightOffset, '#FFD700');
                gradient.addColorStop(1, '#B8860B');
                break;
            case 'silver':
                gradient.addColorStop(0, '#708090');
                gradient.addColorStop(0.2 + lightOffset, '#C0C0C0');
                gradient.addColorStop(0.5, '#F5F5F5');
                gradient.addColorStop(0.8 - lightOffset, '#C0C0C0');
                gradient.addColorStop(1, '#708090');
                break;
            default: // chrome
                gradient.addColorStop(0, '#4A4A4A');
                gradient.addColorStop(0.1 + lightOffset, '#8C8C8C');
                gradient.addColorStop(0.3, '#E8E8E8');
                gradient.addColorStop(0.5, '#FFFFFF');
                gradient.addColorStop(0.7, '#E8E8E8');
                gradient.addColorStop(0.9 - lightOffset, '#8C8C8C');
                gradient.addColorStop(1, '#4A4A4A');
        }
        
        return gradient;
    }

    drawMetallicHighlight(ctx, x1, y1, x2, y2, lineWidth, metalType, lightOffset) {
        const angle = Math.atan2(y2 - y1, x2 - x1);
        const perpAngle = angle + Math.PI / 2;
        
        // ハイライト位置の計算
        const highlightOffset = lineWidth * 0.3;
        const hx1 = x1 + Math.cos(perpAngle) * highlightOffset;
        const hy1 = y1 + Math.sin(perpAngle) * highlightOffset;
        const hx2 = x2 + Math.cos(perpAngle) * highlightOffset;
        const hy2 = y2 + Math.sin(perpAngle) * highlightOffset;
        
        // ハイライトグラデーション
        const highlightGradient = ctx.createLinearGradient(hx1, hy1, hx2, hy2);
        highlightGradient.addColorStop(0, 'rgba(255, 255, 255, 0)');
        highlightGradient.addColorStop(0.3 + lightOffset, 'rgba(255, 255, 255, 0.8)');
        highlightGradient.addColorStop(0.7 - lightOffset, 'rgba(255, 255, 255, 0.6)');
        highlightGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        
        ctx.strokeStyle = highlightGradient;
        ctx.lineWidth = lineWidth * 0.4;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(hx1, hy1);
        ctx.lineTo(hx2, hy2);
        ctx.stroke();
    }

    drawArrowHeadHighlight(ctx, tip, left, right, center, metalType, lightOffset) {
        // 矢頭の中央ハイライト
        const highlightGradient = ctx.createRadialGradient(
            tip.x, tip.y, 0,
            tip.x, tip.y, 20
        );
        highlightGradient.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
        highlightGradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.4)');
        highlightGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        
        ctx.fillStyle = highlightGradient;
        ctx.beginPath();
        ctx.arc(tip.x, tip.y, 8, 0, Math.PI * 2);
        ctx.fill();
        
        // エッジハイライト
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(tip.x, tip.y);
        ctx.lineTo((left.x + tip.x) / 2, (left.y + tip.y) / 2);
        ctx.moveTo(tip.x, tip.y);
        ctx.lineTo((right.x + tip.x) / 2, (right.y + tip.y) / 2);
        ctx.stroke();
    }

    drawNeonArrow(ctx, startX, startY, endX, endY, angle, headlen, lineWidth, time) {
        // ネオン効果のための複数レイヤー
        const glowIntensity = this.animated ? 
            15 + 10 * Math.sin(time * 0.005) : 15;
        
        // 外側のグロー
        ctx.shadowColor = this.color;
        ctx.shadowBlur = glowIntensity;
        ctx.strokeStyle = this.color;
        ctx.lineWidth = lineWidth * 0.5;
        ctx.lineCap = 'round';
        
        // グローレイヤー
        for (let i = 0; i < 3; i++) {
            ctx.globalAlpha = 0.3 - i * 0.1;
            ctx.beginPath();
            ctx.moveTo(startX, startY);
            ctx.lineTo(endX - headlen * 0.8 * Math.cos(angle), endY - headlen * 0.8 * Math.sin(angle));
            ctx.stroke();
        }
        
        // コア（明るい中心線）
        ctx.globalAlpha = 1;
        ctx.shadowBlur = 5;
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = lineWidth * 0.3;
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX - headlen * 0.8 * Math.cos(angle), endY - headlen * 0.8 * Math.sin(angle));
        ctx.stroke();
        
        // ネオン矢頭
        ctx.fillStyle = this.color;
        ctx.shadowBlur = glowIntensity;
        ctx.beginPath();
        ctx.moveTo(endX, endY);
        ctx.lineTo(
            endX - headlen * Math.cos(angle - Math.PI / 7),
            endY - headlen * Math.sin(angle - Math.PI / 7)
        );
        ctx.lineTo(
            endX - headlen * 0.5 * Math.cos(angle),
            endY - headlen * 0.5 * Math.sin(angle)
        );
        ctx.lineTo(
            endX - headlen * Math.cos(angle + Math.PI / 7),
            endY - headlen * Math.sin(angle + Math.PI / 7)
        );
        ctx.closePath();
        ctx.fill();
    }

    drawGradientArrow(ctx, startX, startY, endX, endY, angle, headlen, lineWidth) {
        // グラデーション作成
        const gradient = ctx.createLinearGradient(startX, startY, endX, endY);
        gradient.addColorStop(0, this.color);
        gradient.addColorStop(0.5, '#ff6b6b');
        gradient.addColorStop(1, '#4ecdc4');
        
        // 線の描画
        ctx.strokeStyle = gradient;
        ctx.lineWidth = lineWidth;
        ctx.lineCap = 'round';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
        ctx.shadowBlur = 5;
        ctx.shadowOffsetY = 2;
        
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX - headlen * 0.8 * Math.cos(angle), endY - headlen * 0.8 * Math.sin(angle));
        ctx.stroke();
        
        // グラデーション矢頭
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.moveTo(endX, endY);
        ctx.lineTo(
            endX - headlen * Math.cos(angle - Math.PI / 7),
            endY - headlen * Math.sin(angle - Math.PI / 7)
        );
        ctx.lineTo(
            endX - headlen * 0.6 * Math.cos(angle),
            endY - headlen * 0.6 * Math.sin(angle)
        );
        ctx.lineTo(
            endX - headlen * Math.cos(angle + Math.PI / 7),
            endY - headlen * Math.sin(angle + Math.PI / 7)
        );
        ctx.closePath();
        ctx.fill();
    }
}
