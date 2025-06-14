export class Ellipse {
    constructor(startX, startY, endX, endY, options = {}) {
        this.startX = startX;
        this.startY = startY;
        this.endX = endX;
        this.endY = endY;
        this.type = 'ellipse';

        this.color = options.color || 'rgba(239, 83, 80, 0.9)';
        this.thickness = options.thickness || 1.5;
    }

    draw(ctx, w, h) {
        const x1 = this.startX * w;
        const y1 = this.startY * h;
        const x2 = this.endX * w;
        const y2 = this.endY * h;

        const centerX = (x1 + x2) / 2;
        const centerY = (y1 + y2) / 2;
        const radiusX = Math.abs(x2 - x1) / 2;
        const radiusY = Math.abs(y2 - y1) / 2;

        if (radiusX <= 0 || radiusY <= 0) return;

        ctx.save();

        ctx.lineWidth = Math.max(2, Math.min(w, h) * 0.003 * this.thickness);
        ctx.strokeStyle = this.color;

        // 線の色を元に、半透明の塗りつぶし色を生成
        let fillColor = 'rgba(255, 255, 255, 0.1)';
        if (this.color.startsWith('#')) {
            const r = parseInt(this.color.slice(1, 3), 16);
            const g = parseInt(this.color.slice(3, 5), 16);
            const b = parseInt(this.color.slice(5, 7), 16);
            fillColor = `rgba(${r}, ${g}, ${b}, 0.15)`;
        } else if (this.color.startsWith('rgba')) {
             fillColor = this.color.replace(/, ([\d\.]+)\)/, ', 0.15)');
        }
        ctx.fillStyle = fillColor;

        ctx.beginPath();
        ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, 2 * Math.PI);
        ctx.fill();
        ctx.stroke();

        ctx.restore();
    }
}