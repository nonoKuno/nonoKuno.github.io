import { formations } from './formations.js';
import { Arrow } from './arrow.js';
import { Ellipse } from './ellipse.js';

// =================================================================================
// 定数
// =================================================================================

const CONSTANTS = {
    PLAYER_RADIUS: 0.02,
    BALL_RADIUS: 0.015,
    DOUBLE_CLICK_THRESHOLD: 300, // ms
    DEFAULT_ARROW_COLOR: '#d32f2f',
    ALL_COLORS: ['#303f9f', '#d32f2f', '#ffca28', '#4caf50', '#212121', '#fafafa', '#f57f17', '#87CEEB', '#ec407a', '#78909c', '#8e24aa'],
};

// =================================================================================
// ヘルパークラス (DraggableObject, Player, Ball)
// =================================================================================

/**
 * ドラッグ可能なオブジェクトの基底クラス
 */
class DraggableObject {
    constructor(x, y, radius, color) {
        this.x = x; // 相対X座標
        this.y = y; // 相対Y座標
        this.radius = radius; // 相対半径
        this.color = color; // 色
    }

    draw(ctx, w, h) {
        const px = this.x * w;
        const py = this.y * h;
        const pr = this.radius * w;

        ctx.beginPath();
        ctx.arc(px, py, pr, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
    }

    isInside(px, py, w, h) {
        const d = (p, c) => (p - (c.x * w)) ** 2 + (py - (c.y * h)) ** 2 < (c.radius * w) ** 2;
        return d(px, this);
    }
}

/**
 * 選手オブジェクト
 */
class Player extends DraggableObject {
    constructor(x, y, type, teamColors) {
        super(x, y, CONSTANTS.PLAYER_RADIUS, Player.getColor(type, false, teamColors));
        this.type = type; // 'friend' または 'opponent'
        this.name = ''; // 選手名
        this.isGK = false; // GKかどうか
    }

    static getColor(type, isGK, teamColors) {
        return type === 'friend' ? (isGK ? teamColors.friendGK : teamColors.friend) : (isGK ? teamColors.opponentGK : teamColors.opponent);
    }

    updateColor(teamColors) {
        this.color = Player.getColor(this.type, this.isGK, teamColors);
    }

    draw(ctx, w, h) {
        const px = this.x * w;
        const py = this.y * h;
        let pr = this.radius * w;
        const baseColor = this.color;
    
        // スマホ表示の際にサイズを大きくする
        if (window.innerWidth <= 992) {
            pr *= 2.0;
        }

        const gradient = ctx.createRadialGradient(px + pr * 0.3, py - pr * 0.3, pr * 0.1, px, py, pr);
        const hexToRgb = (hex) => {
            let r = 0, g = 0, b = 0;
            if (hex.length === 7) {
                r = parseInt(hex.substring(1, 3), 16);
                g = parseInt(hex.substring(3, 5), 16);
                b = parseInt(hex.substring(5, 7), 16);
            }
            return [r, g, b];
        };

        const rgb = hexToRgb(baseColor);
        const lighten = (c, factor) => Math.min(255, c + (255 - c) * factor);
        const highlightColor = `rgb(${lighten(rgb[0], 0.3)}, ${lighten(rgb[1], 0.3)}, ${lighten(rgb[2], 0.3)})`;
        const shadowColor = `rgb(${rgb[0] * 0.7}, ${rgb[1] * 0.7}, ${rgb[2] * 0.7})`;

        gradient.addColorStop(0, highlightColor);
        gradient.addColorStop(0.6, baseColor);
        gradient.addColorStop(1, shadowColor);

        ctx.beginPath();
        ctx.arc(px, py, pr, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();

        if (this.name) {
            ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--text-color').trim();
            ctx.font = `bold ${pr * 0.8}px sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            const ny = py + pr + pr * 0.8;
            const tw = ctx.measureText(this.name).width;

            ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
            ctx.fillRect(px - tw / 2 - 4, ny - pr * 0.5, tw + 8, pr);
            
            ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--text-color').trim();
            ctx.fillText(this.name, px, ny);
        }
    }
}

/**
 * ボールオブジェクト
 */
// main.js の中の Ball クラスを以下に置き換えてください

class Ball extends DraggableObject {
    constructor(x, y) {
        super(x, y, CONSTANTS.BALL_RADIUS, '#ffffff');
        this.type = 'ball';
    }

    draw(ctx, w, h) {
        const px = this.x * w;
        const py = this.y * h;
        let pr = this.radius * w;

        // スマホ表示の際にサイズを大きくする
        if (window.innerWidth <= 992) {
            pr *= 2.0;
        }

        ctx.beginPath();
        ctx.arc(px + pr * 0.1, py + pr * 0.1, pr, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.fill();

        ctx.beginPath();
        ctx.arc(px, py, pr, 0, Math.PI * 2);
        ctx.fillStyle = '#FFD700'; // 黄色のベースを維持
        ctx.fill();
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = pr * 0.05;
        ctx.stroke();
        
        this.drawPentagon(ctx, px, py, pr * 0.4, '#000000'); // 中央の五角形を維持
        
        // 【変更点①】新しい図形描画メソッドの呼び出しを追加
        this.drawOuterPattern(ctx, px, py, pr);
    }

    drawPentagon(ctx, x, y, radius, color) {
        ctx.save();
        ctx.translate(x, y);
        ctx.beginPath();
        for (let i = 0; i < 5; i++) {
            const angle = (i * Math.PI * 2 / 5) - Math.PI / 2;
            const px = Math.cos(angle) * radius;
            const py = Math.sin(angle) * radius;
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fillStyle = color;
        ctx.fill();
        ctx.restore();
    }

    /**
     * 【変更点②】円周に5個の三角形のような図形を描画するメソッドを新設
     */
    drawOuterPattern(ctx, x, y, radius) {
        ctx.save();
        ctx.translate(x, y);
        ctx.fillStyle = '#000000';

        const numShapes = 5;
        const angleStep = (Math.PI * 2) / numShapes;
        // 中央の五角形の頂点と位置を合わせるための回転オフセット
        const initialRotation = -Math.PI / 2;

        for (let i = 0; i < numShapes; i++) {
            const angle = i * angleStep + initialRotation;

            ctx.save();
            ctx.rotate(angle);

            // 図形の各頂点の半径を定義
            const innerR = radius * 0.5; // 内側の頂点（五角形の外側）
            const outerR = radius * 0.9; // 外側の円弧（ボールの円周付近）
            const spread = Math.PI / 10; // 外側の円弧の角度

            ctx.beginPath();
            ctx.moveTo(innerR, 0); // 内側の頂点へ移動
            ctx.arc(0, 0, outerR, -spread, spread, false); // 外側の円弧を描画
            ctx.closePath(); // パスを閉じて三角形を形成
            ctx.fill();

            ctx.restore();
        }

        ctx.restore();
    }
}


// =================================================================================
// メインアプリケーションクラス
// =================================================================================

class SoccerBoard {
    constructor() {
        this.dom = this._getDomElements();
        this.ctx = this.dom.canvas.getContext('2d');
        this._initializeState();
    }

    /**
     * アプリケーションを初期化する
     */
    init() {
        this.loadVersion();
        this._createColorPalettes();
        this.updateAddPlayerButtonColor('friend');
        this.updateAddPlayerButtonColor('opponent');
        this._updateOrientationButtonsUI(); // UIに初期状態を反映

        this.objects.push(new Ball(0.5, 0.5));

        this.resizeCanvas();
        window.addEventListener('resize', this.resizeCanvas.bind(this));

        this._setupEventListeners();
    }

    /**
     * 必要なDOM要素をすべて取得し、オブジェクトとして返す
     * @private
     */
    _getDomElements() {
        return {
            canvas: document.getElementById('soccer-board'),
            notificationEl: document.getElementById('notification'),
            addFriendBtn: document.getElementById('add-friend'),
            addOpponentBtn: document.getElementById('add-opponent'),
            resetBtn: document.getElementById('reset-board'),
            downloadBtn: document.getElementById('download-image'),
            editPanel: document.getElementById('edit-panel'),
            playerNameInput: document.getElementById('player-name'),
            isGkCheckbox: document.getElementById('is-gk'),
            deletePlayerBtn: document.getElementById('delete-player'),
            closePanelBtn: document.getElementById('close-panel'),
            arrowModeBtn: document.getElementById('arrow-mode'),
            ellipseModeBtn: document.getElementById('ellipse-mode'),
            playerModeBtn: document.getElementById('player-mode'),
            clearArrowsBtn: document.getElementById('clear-arrows'),
            clearEllipsesBtn: document.getElementById('clear-ellipses'),
            clearPlayersBtn: document.getElementById('clear-players'),
            versionNumber: document.getElementById('version-number'),
            controlGroups: document.querySelectorAll('.control-group h3'),
            orientationButtons: {
                horizontal: document.getElementById('horizontal-field'),
                vertical: document.getElementById('vertical-field'),
                half: document.getElementById('half-field'),
            },
            ballDisplayButtons: {
                on: document.getElementById('ball-on'),
                off: document.getElementById('ball-off'),
            },
            fiveLaneButtons: {
                on: document.getElementById('lanes-on'),
                off: document.getElementById('lanes-off'),
            },
            formation: {
                friendSelect: document.getElementById('friend-formation'),
                opponentSelect: document.getElementById('opponent-formation'),
                applyFriendBtn: document.getElementById('apply-friend-formation'),
                applyOpponentBtn: document.getElementById('apply-opponent-formation'),
            }
        };
    }

    /**
     * アプリケーションの状態をプロパティとして初期化する
     * @private
     */
    _initializeState() {
        this.objects = [];
        this.selectedObject = null;
        this.isDragging = false;
        this.dragOffsetX = 0;
        this.dragOffsetY = 0;
        this.lastTap = 0;

        // 画面幅に応じて初期状態を決定
        const isMobile = window.innerWidth <= 992;
        this.isVerticalField = !isMobile; // PCではtrue, スマホではfalse
        this.isHalfField = isMobile;     // PCではfalse, スマホではtrue

        this.showBall = true;
        this.show5Lanes = false;
        this.isArrowMode = false;
        this.isEllipseMode = false;
        this.isDrawingArrow = false;
        this.isDrawingEllipse = false;
        this.currentArrow = null;
        this.currentEllipse = null;
        this.arrowColor = CONSTANTS.DEFAULT_ARROW_COLOR;
        this.notificationTimer = null;

        this.teamColors = {
            friend: CONSTANTS.ALL_COLORS[0],
            friendGK: CONSTANTS.ALL_COLORS[2],
            opponent: CONSTANTS.ALL_COLORS[1],
            opponentGK: CONSTANTS.ALL_COLORS[3]
        };
    }

    _updateOrientationButtonsUI() {
        Object.values(this.dom.orientationButtons).forEach(btn => btn.classList.remove('active'));
        if (this.isHalfField) {
            this.dom.orientationButtons.half.classList.add('active');
        } else if (this.isVerticalField) {
            this.dom.orientationButtons.vertical.classList.add('active');
        } else {
            this.dom.orientationButtons.horizontal.classList.add('active');
        }
    }

    /**
     * すべてのイベントリスナーを設定する
     * @private
     */
    _setupEventListeners() {
        // Canvas events
        this.dom.canvas.addEventListener('mousedown', this._handleDragStart.bind(this));
        this.dom.canvas.addEventListener('mousemove', this._handleDragging.bind(this));
        this.dom.canvas.addEventListener('mouseup', this._handleDragEnd.bind(this));
        this.dom.canvas.addEventListener('mouseleave', this._handleDragEnd.bind(this));
        this.dom.canvas.addEventListener('touchstart', this._handleDragStart.bind(this), { passive: false });
        this.dom.canvas.addEventListener('touchmove', this._handleDragging.bind(this), { passive: false });
        this.dom.canvas.addEventListener('touchend', this._handleDragEnd.bind(this));
        this.dom.canvas.addEventListener('touchcancel', this._handleDragEnd.bind(this));
        this.dom.canvas.addEventListener('dblclick', this._handleDoubleClick.bind(this));

        // Control panel events
        this.dom.addFriendBtn.addEventListener('click', () => this.addPlayer('friend'));
        this.dom.addOpponentBtn.addEventListener('click', () => this.addPlayer('opponent'));
        this.dom.resetBtn.addEventListener('click', this.resetBoard.bind(this));
        this.dom.clearPlayersBtn.addEventListener('click', this.clearPlayers.bind(this));
        this.dom.clearArrowsBtn.addEventListener('click', this.clearArrows.bind(this));
        this.dom.clearEllipsesBtn.addEventListener('click', this.clearEllipses.bind(this));
        this.dom.downloadBtn.addEventListener('click', this.downloadImage.bind(this));

        // Arrow mode
        this.dom.playerModeBtn.addEventListener('click', () => this._setDrawingMode('player'));
        this.dom.arrowModeBtn.addEventListener('click', () => this._setDrawingMode('arrow'));
        this.dom.ellipseModeBtn.addEventListener('click', () => this._setDrawingMode('ellipse'));

        // Edit panel events
        this.dom.playerNameInput.addEventListener('input', this._updatePlayerName.bind(this));
        this.dom.isGkCheckbox.addEventListener('change', this._updatePlayerGKStatus.bind(this));
        this.dom.deletePlayerBtn.addEventListener('click', this._deleteSelectedPlayer.bind(this));
        this.dom.closePanelBtn.addEventListener('click', this.hideEditPanel.bind(this));

        // Settings
        this.dom.orientationButtons.horizontal.addEventListener('click', () => this.toggleFieldOrientation('horizontal'));
        this.dom.orientationButtons.vertical.addEventListener('click', () => this.toggleFieldOrientation('vertical'));
        this.dom.orientationButtons.half.addEventListener('click', () => this.toggleFieldOrientation('half'));

        this.dom.ballDisplayButtons.on.addEventListener('click', () => this.toggleBallDisplay(true));
        this.dom.ballDisplayButtons.off.addEventListener('click', () => this.toggleBallDisplay(false));

        this.dom.fiveLaneButtons.on.addEventListener('click', () => this.toggle5LanesDisplay(true));
        this.dom.fiveLaneButtons.off.addEventListener('click', () => this.toggle5LanesDisplay(false));
        
        // Formations
        this.dom.formation.applyFriendBtn.addEventListener('click', () => {
            const formation = this.dom.formation.friendSelect.value;
            if (formation) this.applyFormation('friend', formation);
        });
        this.dom.formation.applyOpponentBtn.addEventListener('click', () => {
            const formation = this.dom.formation.opponentSelect.value;
            if (formation) this.applyFormation('opponent', formation);
        });

        // Collapsible sections
        this.dom.controlGroups.forEach(header => {
            header.addEventListener('click', () => {
                header.parentElement.classList.toggle('collapsed');
            });
        });
    }

    // --- Drawing Methods ---

    /**
     * すべてのオブジェクトを描画するメイン関数
     */
    draw() {
        const w = this.dom.canvas.width / (window.devicePixelRatio || 1);
        const h = this.dom.canvas.height / (window.devicePixelRatio || 1);

        this.ctx.clearRect(0, 0, this.dom.canvas.width, this.dom.canvas.height);
        this._drawField(w, h);
        
        this.objects.forEach(obj => {
            if (obj.type === 'ball' && !this.showBall) return;
            obj.draw(this.ctx, w, h);
        });
    }

    /**
     * サッカーフィールドの線を描画する
     * @private
     */
    _drawField(w, h) {
        const varToRgb = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();
        this.ctx.strokeStyle = varToRgb('--line-color');
        this.ctx.lineWidth = Math.max(2, w * 0.004);

        this.ctx.strokeRect(w * 0.05, h * 0.05, w * 0.9, h * 0.9);

        if (this.isHalfField) {
            this.ctx.beginPath(); this.ctx.moveTo(w * 0.05, h * 0.05); this.ctx.lineTo(w * 0.95, h * 0.05); this.ctx.stroke();
            this.ctx.beginPath(); this.ctx.arc(w * 0.5, h * 0.05, h * 0.1, 0, Math.PI); this.ctx.stroke();
            this.ctx.beginPath(); this.ctx.arc(w * 0.5, h * 0.05, h * 0.005, 0, Math.PI * 2); this.ctx.fillStyle = varToRgb('--line-color'); this.ctx.fill();
            this.ctx.strokeRect(w * 0.2, h * 0.65, w * 0.6, h * 0.3);
            this.ctx.strokeRect(w * 0.35, h * 0.81, w * 0.3, h * 0.14);
        } else if (this.isVerticalField) {
            this.ctx.beginPath(); this.ctx.moveTo(w * 0.05, h * 0.5); this.ctx.lineTo(w * 0.95, h * 0.5); this.ctx.stroke();
            this.ctx.beginPath(); this.ctx.arc(w * 0.5, h * 0.5, h * 0.1, 0, Math.PI * 2); this.ctx.stroke();
            this.ctx.beginPath(); this.ctx.arc(w * 0.5, h * 0.5, h * 0.005, 0, Math.PI * 2); this.ctx.fillStyle = varToRgb('--line-color'); this.ctx.fill();
            this.ctx.strokeRect(w * 0.2, h * 0.05, w * 0.6, h * 0.15);
            this.ctx.strokeRect(w * 0.35, h * 0.05, w * 0.3, h * 0.07);
            this.ctx.strokeRect(w * 0.2, h * 0.8, w * 0.6, h * 0.15);
            this.ctx.strokeRect(w * 0.35, h * 0.88, w * 0.3, h * 0.07);
        } else {
            this.ctx.beginPath(); this.ctx.moveTo(w * 0.5, h * 0.05); this.ctx.lineTo(w * 0.5, h * 0.95); this.ctx.stroke();
            this.ctx.beginPath(); this.ctx.arc(w * 0.5, h * 0.5, w * 0.1, 0, Math.PI * 2); this.ctx.stroke();
            this.ctx.beginPath(); this.ctx.arc(w * 0.5, h * 0.5, w * 0.005, 0, Math.PI * 2); this.ctx.fillStyle = varToRgb('--line-color'); this.ctx.fill();
            this.ctx.strokeRect(w * 0.05, h * 0.2, w * 0.15, h * 0.6);
            this.ctx.strokeRect(w * 0.05, h * 0.35, w * 0.07, h * 0.3);
            this.ctx.strokeRect(w * 0.8, h * 0.2, w * 0.15, h * 0.6);
            this.ctx.strokeRect(w * 0.88, h * 0.35, w * 0.07, h * 0.3);
        }

        if (this.show5Lanes) {
            this.ctx.save();
            this.ctx.lineWidth = Math.max(1, w * 0.0015);
            this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.25)';
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
            this.ctx.setLineDash([w * 0.015, w * 0.015]);
            this.ctx.textAlign = 'center';

            const laneLabels = ["アウトレーン", "ハーフスペース", "センターレーン", "ハーフスペース", "アウトレーン"];

            if (this.isVerticalField || this.isHalfField) {
                const laneWidth = (w * 0.9) / 5;
                const startX = w * 0.05;
                this.ctx.font = `bold ${Math.max(9, w * 0.018)}px sans-serif`;

                for (let i = 1; i < 5; i++) {
                    const x = startX + laneWidth * i;
                    this.ctx.beginPath();
                    this.ctx.moveTo(x, h * 0.05);
                    this.ctx.lineTo(x, h * 0.95);
                    this.ctx.stroke();
                }

                laneLabels.forEach((label, i) => {
                    const x = startX + laneWidth * (i + 0.5);
                    const yPos = this.isHalfField ? h * 0.1 : h * 0.08;
                    this.ctx.fillText(label, x, yPos);
                    if (!this.isHalfField) {
                         this.ctx.fillText(label, x, h * 0.92);
                    }
                });
            } else { // Horizontal field
                const laneWidth = (h * 0.9) / 5;
                const startY = h * 0.05;
                this.ctx.font = `bold ${Math.max(9, h * 0.025)}px sans-serif`;
                this.ctx.textBaseline = 'middle';

                for (let i = 1; i < 5; i++) {
                    const y = startY + laneWidth * i;
                    this.ctx.beginPath();
                    this.ctx.moveTo(w * 0.05, y);
                    this.ctx.lineTo(w * 0.95, y);
                    this.ctx.stroke();
                }

                laneLabels.forEach((label, i) => {
                    const y = startY + laneWidth * (i + 0.5);
                    this.ctx.fillText(label, w * 0.1, y);
                    this.ctx.fillText(label, w * 0.9, y);
                });
            }
            this.ctx.restore();
        }
    }

    // --- Event Handlers ---
    _handleDragStart(e) {
        const pos = this._getMousePos(e);
        const w = this.dom.canvas.width / (window.devicePixelRatio || 1);
        const h = this.dom.canvas.height / (window.devicePixelRatio || 1);

        if (this.isArrowMode || this.isEllipseMode) {
            e.preventDefault(); // 描画モードの時はスクロールさせない
            this.isDrawingArrow = this.isArrowMode;
            this.isDrawingEllipse = this.isEllipseMode;
            
            if (this.isArrowMode) {
                const arrowOptions = { color: this.arrowColor, style: 'modern', thickness: 1.5 };
                this.currentArrow = new Arrow(pos.x / w, pos.y / h, pos.x / w, pos.y / h, arrowOptions);
                this.objects.push(this.currentArrow);
            } else { // Ellipse Mode
                const ellipseOptions = { color: this.arrowColor, thickness: 1.5 };
                this.currentEllipse = new Ellipse(pos.x / w, pos.y / h, pos.x / w, pos.y / h, ellipseOptions);
                this.objects.push(this.currentEllipse);
            }

        } else {
            if (new Date().getTime() - this.lastTap < CONSTANTS.DOUBLE_CLICK_THRESHOLD) {
                this._handleDoubleClick(e);
                return;
            }
            this.lastTap = new Date().getTime();

            this.selectedObject = null;
            for (let i = this.objects.length - 1; i >= 0; i--) {
                const obj = this.objects[i];
                if (obj.type === 'arrow' || obj.type === 'ellipse' || !obj.isInside) continue;
                if (obj.isInside(pos.x, pos.y, w, h)) {
                    if (obj.type === 'ball' && !this.showBall) continue;
                    this.selectedObject = obj;
                    break;
                }
            }

            if (this.selectedObject) {
                e.preventDefault(); // 選手やボールを掴んだ時だけスクロールを止める
                this.isDragging = true;
                this.objects = this.objects.filter(o => o !== this.selectedObject);
                this.objects.push(this.selectedObject);
                this.dragOffsetX = pos.x - this.selectedObject.x * w;
                this.dragOffsetY = pos.y - this.selectedObject.y * h;
                this.hideEditPanel();
                this.draw();
            } else {
                this.hideEditPanel();
            }
        }
    }

    _handleDragging(e) {
        if (this.isDrawingArrow && this.currentArrow) {
            e.preventDefault();
            const pos = this._getMousePos(e);
            const w = this.dom.canvas.width / (window.devicePixelRatio || 1);
            const h = this.dom.canvas.height / (window.devicePixelRatio || 1);
            this.currentArrow.endX = pos.x / w;
            this.currentArrow.endY = pos.y / h;
            this.draw();
        } else if (this.isDrawingEllipse && this.currentEllipse) {
            e.preventDefault();
            const pos = this._getMousePos(e);
            const w = this.dom.canvas.width / (window.devicePixelRatio || 1);
            const h = this.dom.canvas.height / (window.devicePixelRatio || 1);
            this.currentEllipse.endX = pos.x / w;
            this.currentEllipse.endY = pos.y / h;
            this.draw();
        } else if (this.isDragging && this.selectedObject) {
            e.preventDefault();
            const pos = this._getMousePos(e);
            const w = this.dom.canvas.width / (window.devicePixelRatio || 1);
            const h = this.dom.canvas.height / (window.devicePixelRatio || 1);
            this.selectedObject.x = (pos.x - this.dragOffsetX) / w;
            this.selectedObject.y = (pos.y - this.dragOffsetY) / h;
            const rx = this.selectedObject.radius;
            const ry = this.selectedObject.radius * (w / h);
            this.selectedObject.x = Math.max(rx, Math.min(this.selectedObject.x, 1 - rx));
            this.selectedObject.y = Math.max(ry, Math.min(this.selectedObject.y, 1 - ry));
            this.draw();
        }
    }

    _handleDragEnd() {
        if (this.isDrawingArrow) {
            this.isDrawingArrow = false;
            this.currentArrow = null;
        }
        if (this.isDrawingEllipse) {
            this.isDrawingEllipse = false;
            this.currentEllipse = null;
        }
        this.isDragging = false;
        this.draw();
    }

    _handleDoubleClick(e) {
        if (this.isDragging) return;
        const pos = this._getMousePos(e);
        const w = this.dom.canvas.width / (window.devicePixelRatio || 1);
        const h = this.dom.canvas.height / (window.devicePixelRatio || 1);
        let target = null;

        for (let i = this.objects.length - 1; i >= 0; i--) {
            const obj = this.objects[i];
            if (obj.isInside(pos.x, pos.y, w, h)) {
                if (obj.type === 'ball' && !this.showBall) continue;
                target = obj;
                break;
            }
        }

        if (target && target.type !== 'ball' && target.type !== 'arrow') {
            this.selectedObject = target;
            this.showEditPanel(e);
        } else {
            this.selectedObject = null;
            this.hideEditPanel();
        }
        this.draw();
    }

    // --- Public Methods (API for UI) ---
    addPlayer(type) {
        if (this.objects.filter(o => o.type === type).length >= 11) {
            this.showNotification(`${type === 'friend' ? '味方' : '敵'}は11人までです`);
            return;
        }
        this.objects.push(new Player(0.2 + Math.random() * 0.6, 0.2 + Math.random() * 0.6, type, this.teamColors));
        this.draw();
    }

    resetBoard() {
        this.objects = [new Ball(0.5, 0.5)];
        this.hideEditPanel();
        this.selectedObject = null;
        this.draw();
    }

    clearPlayers() {
        this.objects = this.objects.filter(o => o.type !== 'friend' && o.type !== 'opponent');
        this.hideEditPanel();
        this.selectedObject = null;
        this.draw();
    }

    clearArrows() {
        this.objects = this.objects.filter(o => o.type !== 'arrow');
        this.draw();
    }

    clearEllipses() {
        this.objects = this.objects.filter(o => o.type !== 'ellipse');
        this.draw();
    }

    _setDrawingMode(mode) {
        this.isArrowMode = mode === 'arrow';
        this.isEllipseMode = mode === 'ellipse';

        this.dom.playerModeBtn.classList.toggle('active', mode === 'player');
        this.dom.arrowModeBtn.classList.toggle('active', this.isArrowMode);
        this.dom.ellipseModeBtn.classList.toggle('active', this.isEllipseMode);

        this.dom.canvas.classList.toggle('arrow-mode', this.isArrowMode || this.isEllipseMode);
    }
    
    applyFormation(type, formationName) {
        if (!formations[formationName]) return;
        this.objects = this.objects.filter(o => o.type !== type);
        const formation = formations[formationName];
        const isOpponent = type === 'opponent';

        const adjustPos = (p) => {
            let [x, y] = p;
            if (isOpponent) y = 1 - y;
            if (!this.isVerticalField) [x, y] = [1 - y, x];
            return [x, y];
        };

        const gkPos = adjustPos([...formation.gk]);
        const gk = new Player(gkPos[0], gkPos[1], type, this.teamColors);
        gk.isGK = true;
        gk.updateColor(this.teamColors);
        this.objects.push(gk);

        formation.players.forEach(pos => {
            const playerPos = adjustPos([...pos]);
            this.objects.push(new Player(playerPos[0], playerPos[1], type, this.teamColors));
        });

        this.draw();
    }

    toggleFieldOrientation(mode) {
        const oldMode = this.isHalfField ? 'half' : (this.isVerticalField ? 'vertical' : 'horizontal');
        if (oldMode === mode) return;

        if ((oldMode === 'vertical' && mode === 'horizontal') || (oldMode === 'horizontal' && mode === 'vertical')) {
            this.objects.forEach(obj => {
                const transform = (oldMode === 'vertical') ? ([x, y]) => [1 - y, x] : ([x, y]) => [y, 1 - x];
                if (obj.type === 'arrow') {
                    [obj.startX, obj.startY] = transform([obj.startX, obj.startY]);
                    [obj.endX, obj.endY] = transform([obj.endX, obj.endY]);
                } else if (obj.x !== undefined) {
                    [obj.x, obj.y] = transform([obj.x, obj.y]);
                }
            });
        }

        this.isVerticalField = (mode === 'vertical');
        this.isHalfField = (mode === 'half');
        
        Object.values(this.dom.orientationButtons).forEach(btn => btn.classList.remove('active'));
        this.dom.orientationButtons[mode].classList.add('active');

        this.resizeCanvas();
    }

    toggleBallDisplay(show) {
        this.showBall = show;
        this.dom.ballDisplayButtons.on.classList.toggle('active', show);
        this.dom.ballDisplayButtons.off.classList.toggle('active', !show);
        if (!show && this.selectedObject && this.selectedObject.type === 'ball') {
            this.selectedObject = null;
            this.hideEditPanel();
        }
        this.draw();
    }

    toggle5LanesDisplay(show) {
        this.show5Lanes = show;
        this.dom.fiveLaneButtons.on.classList.toggle('active', show);
        this.dom.fiveLaneButtons.off.classList.toggle('active', !show);
        this.draw();
    }

    // --- UI Methods ---

    showEditPanel(e) {
        if (!this.selectedObject || this.selectedObject.type === 'ball') return;
        this.dom.playerNameInput.value = this.selectedObject.name;
        this.dom.isGkCheckbox.checked = this.selectedObject.isGK;

        const clientX = e.clientX ?? e.touches[0].clientX;
        const clientY = e.clientY ?? e.touches[0].clientY;
        let top = clientY + 20, left = clientX;
        if (left + 240 > window.innerWidth) left = window.innerWidth - 250;
        if (top + 200 > window.innerHeight) top = clientY - 220;
        
        this.dom.editPanel.style.top = `${top}px`;
        this.dom.editPanel.style.left = `${left}px`;
        this.dom.editPanel.classList.add('active');
    }

    hideEditPanel() {
        this.dom.editPanel.classList.remove('active');
    }

    showNotification(msg) {
        clearTimeout(this.notificationTimer);
        this.dom.notificationEl.textContent = msg;
        this.dom.notificationEl.style.opacity = '1';
        this.dom.notificationEl.style.top = '20px';
        this.notificationTimer = setTimeout(() => {
            this.dom.notificationEl.style.opacity = '0';
            this.dom.notificationEl.style.top = '0px';
        }, 3000);
    }

    updateAddPlayerButtonColor(type) {
        const btn = type === 'friend' ? this.dom.addFriendBtn : this.dom.addOpponentBtn;
        const color = type === 'friend' ? this.teamColors.friend : this.teamColors.opponent;
        btn.style.background = color;
    }

    // --- System & Utility Methods ---
    resizeCanvas() {
        // スマホサイズで縦向きが選択されていた場合、自陣表示に切り替える
        const isMobile = window.innerWidth <= 992;
        if (isMobile && this.isVerticalField) {
            this.toggleFieldOrientation('half');
            return; // toggleFieldOrientationがresizeCanvasを再帰的に呼ぶのでここで終了
        }

        const container = this.dom.canvas.parentElement;
        const dpr = window.devicePixelRatio || 1;
        const boardWidth = container.clientWidth;
        let boardHeight;

        if (this.isHalfField) {
            boardHeight = boardWidth * (52.5 / 68);
        } else if (this.isVerticalField) {
            boardHeight = boardWidth * (105 / 68);
        } else {
            boardHeight = boardWidth * (68 / 105);
        }
        
        this.dom.canvas.style.width = `${boardWidth}px`;
        this.dom.canvas.style.height = `${boardHeight}px`;
        this.dom.canvas.width = boardWidth * dpr;
        this.dom.canvas.height = boardHeight * dpr;
        this.ctx.scale(dpr, dpr);
        this.draw();
    }

    downloadImage() {
        const originalSelection = this.selectedObject;
        this.selectedObject = null; // 選択状態を解除して綺麗な画像を生成

        // 一時的に背景を描画
        this.ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--field-bg').trim();
        this.ctx.fillRect(0, 0, this.dom.canvas.width, this.dom.canvas.height);

        const w = this.dom.canvas.width / (window.devicePixelRatio || 1);
        const h = this.dom.canvas.height / (window.devicePixelRatio || 1);
        
        this._drawField(w, h);
        this.objects.forEach(obj => {
            if (obj.type === 'ball' && !this.showBall) return;
            obj.draw(this.ctx, w, h);
        });
        
        // クレジットを描画
        this.ctx.save();
        this.ctx.fillStyle = 'rgba(128, 128, 128, 0.8)';
        this.ctx.font = `bold ${Math.max(12, w * 0.015)}px sans-serif`;
        this.ctx.textAlign = 'right';
        this.ctx.textBaseline = 'bottom';
        this.ctx.fillText('https://nonokuno.github.io/soccerBoard/', w * 0.98, h * 0.98);
        this.ctx.restore();

        const dataUrl = this.dom.canvas.toDataURL('image/png');
        const isMobile = window.innerWidth <= 992;

        if (isMobile) {
            // スマホでは新しいタブで画像を開く
            const newTab = window.open();
            newTab.document.body.innerHTML = `<img src="${dataUrl}" style="max-width: 100%; height: auto;">`;
            newTab.document.title = "サッカー戦術ボード";
        } else {
            // PCでは画像をダウンロード
            const link = document.createElement('a');
            link.download = 'soccer-board.png';
            link.href = dataUrl;
            link.click();
        }
        
        this.selectedObject = originalSelection; // 選択状態を復元
        this.draw(); // ボードの表示を元に戻す
    }

    loadVersion() {
        fetch('version.json')
            .then(response => response.json())
            .then(data => {
                this.dom.versionNumber.textContent = data.version;
            })
            .catch(error => {
                console.error('Failed to load version info:', error);
                this.dom.versionNumber.textContent = 'N/A';
            });
    }

    _getMousePos(evt) {
        const rect = this.dom.canvas.getBoundingClientRect();
        const clientX = evt.clientX ?? evt.touches[0].clientX;
        const clientY = evt.clientY ?? evt.touches[0].clientY;
        return {
            x: (clientX - rect.left) * (this.dom.canvas.width / (window.devicePixelRatio || 1) / rect.width),
            y: (clientY - rect.top) * (this.dom.canvas.height / (window.devicePixelRatio || 1) / rect.height)
        };
    }

    // --- Private Methods for UI interaction ---
    _createColorPalettes() {
        const create = (id, cat, defaultColor) => this._createColorPalette(id, CONSTANTS.ALL_COLORS, cat, defaultColor);
        create('friend-color-palette', 'friend', this.teamColors.friend);
        create('friend-gk-color-palette', 'friendGK', this.teamColors.friendGK);
        create('opponent-color-palette', 'opponent', this.teamColors.opponent);
        create('opponent-gk-color-palette', 'opponentGK', this.teamColors.opponentGK);
        create('arrow-color-palette', 'arrow', this.arrowColor);
    }

    _createColorPalette(containerId, colors, category, defaultColor) {
        const container = document.getElementById(containerId);
        container.innerHTML = '';
        colors.forEach(color => {
            const colorEl = document.createElement('div');
            colorEl.className = 'palette-color';
            colorEl.style.backgroundColor = color;
            if (color === defaultColor) colorEl.classList.add('active');

                colorEl.addEventListener('click', () => {
                // 選択された色をアクティブにする
                container.querySelectorAll('.palette-color').forEach(el => el.classList.remove('active'));
                colorEl.classList.add('active');

                if (category === 'arrow') {
                    // 矢印の基準色を更新
                    this.arrowColor = color;
                } else {
                    // チームカラーの状態を更新
                    this.teamColors[category] = color;

                    // 「選手を追加」ボタンの色を更新
                    if (category === 'friend' || category === 'opponent') {
                        this.updateAddPlayerButtonColor(category);
                    }

                    // 既存の選手オブジェクトの色を更新
                    const teamType = category.replace('GK', '');
                    this.objects.forEach(obj => {
                        if (obj.type === teamType) {
                            const isTargetGK = category.includes('GK');
                            // 通常選手かGKかで判断し、該当する選手の色を更新
                            if ((isTargetGK && obj.isGK) || (!isTargetGK && !obj.isGK)) {
                                obj.updateColor(this.teamColors);
                            }
                        }
                    });
                }

                // ボード全体を再描画
                this.draw();
            });
            container.appendChild(colorEl);
        });
    }

    _toggleArrowMode() {
        this.isArrowMode = !this.isArrowMode;
        this.dom.arrowModeBtn.classList.toggle('active', this.isArrowMode);
        this.dom.canvas.classList.toggle('arrow-mode', this.isArrowMode);
        this.dom.arrowModeBtn.textContent = this.isArrowMode ? '選手を動かす（矢印モードを止める）' : '矢印を描く';
    }

    _updatePlayerName() {
        if (this.selectedObject) {
            this.selectedObject.name = this.dom.playerNameInput.value.trim();
            this.draw();
        }
    }

    _updatePlayerGKStatus() {
        if (!this.selectedObject) return;
        if (this.dom.isGkCheckbox.checked && this.objects.some(o => o.type === this.selectedObject.type && o.isGK && o !== this.selectedObject)) {
            this.showNotification(`GKは各チーム1人までです`);
            this.dom.isGkCheckbox.checked = false;
            return;
        }
        this.selectedObject.isGK = this.dom.isGkCheckbox.checked;
        this.selectedObject.updateColor(this.teamColors);
        this.draw();
    }

    _deleteSelectedPlayer() {
        if (this.selectedObject) {
            this.objects = this.objects.filter(o => o !== this.selectedObject);
            this.selectedObject = null;
            this.hideEditPanel();
            this.draw();
        }
    }
}


// =================================================================================
// アプリケーションの起動
// =================================================================================

document.addEventListener('DOMContentLoaded', () => {
    const boardApp = new SoccerBoard();
    boardApp.init();
});