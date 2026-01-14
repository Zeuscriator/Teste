class Simulation {
    constructor() {
        this.canvas = document.getElementById('simulationCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.cells = [];
        this.antibodies = [];
        this.specializedAntibodies = [];
        this.running = false;
        this.health = 100;
        this.hivVaccineActive = false;
        this.immunityLevel = 0;
        this.vaccineCooldown = 0;
        this.init();
    }

    init() {
        // Adiciona algumas células de defesa iniciais
        this.addCell('macrophage', 100, 100);
        this.addCell('macrophage', 700, 400);
        this.addCell('tcell', 200, 300);
        this.addCell('bcell', 600, 200);
        this.updateStats();
        this.updateVaccineStatus();
    }

    addCell(type, x, y) {
        const cell = {
            type: type,
            x: x || Math.random() * this.canvas.width,
            y: y || Math.random() * this.canvas.height,
            vx: (Math.random() - 0.5) * 2,
            vy: (Math.random() - 0.5) * 2,
            size: this.getSize(type),
            color: this.getColor(type),
            health: 100,
            attack: this.getAttack(type),
            cooldown: 0,
            infected: false,
            vaccinated: this.hivVaccineActive && type === 'tcell' // Células T novas já nascem protegidas
        };
        this.cells.push(cell);
        this.logEvent(`${this.getTypeName(type)} adicionado ao sistema`);
    }

    addPathogen(type) {
        const pathogen = {
            type: type,
            x: Math.random() * this.canvas.width,
            y: Math.random() * this.canvas.height,
            vx: (Math.random() - 0.5) * 3,
            vy: (Math.random() - 0.5) * 3,
            size: this.getSize(type),
            color: this.getColor(type),
            health: type === 'hiv' ? 30 : 50,
            replication: 0,
            targetCell: null
        };
        this.cells.push(pathogen);
        this.logEvent(`${this.getTypeName(type)} invasor detectado!`);
    }

    addAntibody() {
        const antibody = {
            x: Math.random() * this.canvas.width,
            y: Math.random() * this.canvas.height,
            vx: (Math.random() - 0.5) * 4,
            vy: (Math.random() - 0.5) * 4,
            size: 3,
            color: '#00bcd4',
            target: null
        };
        this.antibodies.push(antibody);
        this.logEvent('Anticorpos liberados!');
    }

    addSpecializedAntibody() {
        const antibody = {
            x: Math.random() * this.canvas.width,
            y: Math.random() * this.canvas.height,
            vx: (Math.random() - 0.5) * 5,
            vy: (Math.random() - 0.5) * 5,
            size: 4,
            color: '#66bb6a',
            target: null,
            specialized: true,
            damage: 15 // Anticorpos especializados causam mais dano ao HIV
        };
        this.specializedAntibodies.push(antibody);
    }

    administerHIVVaccine() {
        if (this.hivVaccineActive) {
            this.logEvent('💊 Reforço da vacina aplicado!');
        } else {
            this.hivVaccineActive = true;
            this.logEvent('💉 VACINA CONTRA HIV APLICADA! Sistema imunológico preparado.');
        }
        
        this.vaccineCooldown = 600; // 600 frames de proteção máxima
        this.immunityLevel = 100;
        
        // Protege todas as células T existentes
        this.cells.forEach(cell => {
            if (cell.type === 'tcell') {
                cell.vaccinated = true;
                cell.color = '#4fc3f7'; // Azul mais forte para células protegidas
            }
        });
        
        // Gera anticorpos especializados imediatamente
        for (let i = 0; i < 5; i++) {
            this.addSpecializedAntibody();
        }
        
        this.updateVaccineStatus();
    }

    getSize(type) {
        const sizes = {
            'virus': 8,
            'bacteria': 12,
            'fungus': 15,
            'hiv': 6,
            'macrophage': 20,
            'tcell': 18,
            'bcell': 16
        };
        return sizes[type] || 10;
    }

    getColor(type) {
        const colors = {
            'virus': '#ff5252',
            'bacteria': '#ff9800',
            'fungus': '#9c27b0',
            'hiv': '#8e24aa',
            'macrophage': '#4caf50',
            'tcell': '#2196f3',
            'bcell': '#ffeb3b'
        };
        return colors[type] || '#ffffff';
    }

    getAttack(type) {
        const attacks = {
            'macrophage': 25,
            'tcell': 15,
            'bcell': 10
        };
        return attacks[type] || 0;
    }

    getTypeName(type) {
        const names = {
            'virus': 'Vírus',
            'bacteria': 'Bactéria',
            'fungus': 'Fungo',
            'hiv': 'Vírus HIV',
            'macrophage': 'Macrófago',
            'tcell': 'Linfócito T',
            'bcell': 'Linfócito B'
        };
        return names[type] || 'Célula';
    }

    update() {
        if (!this.running) return;

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Atualiza vacina
        this.updateVaccine();

        // Atualiza células
        for (let i = this.cells.length - 1; i >= 0; i--) {
            const cell = this.cells[i];
            
            // Movimento
            cell.x += cell.vx;
            cell.y += cell.vy;

            // Limites
            if (cell.x < 0 || cell.x > this.canvas.width) cell.vx *= -1;
            if (cell.y < 0 || cell.y > this.canvas.height) cell.vy *= -1;

            // Comportamento específico
            if (['virus', 'bacteria', 'fungus', 'hiv'].includes(cell.type)) {
                this.updatePathogen(cell, i);
            } else {
                this.updateDefense(cell, i);
            }

            // Desenha célula
            this.drawCell(cell);
        }

        // Atualiza anticorpos
        this.updateAntibodies();
        this.updateSpecializedAntibodies();

        this.updateStats();
        this.updateHealth();
    }

    updateVaccine() {
        if (this.hivVaccineActive && this.vaccineCooldown > 0) {
            this.vaccineCooldown--;
            this.immunityLevel = (this.vaccineCooldown / 600) * 100;
            
            // Gera anticorpos especializados periodicamente
            if (Math.random() < 0.02) {
                this.addSpecializedAntibody();
            }
            
            if (this.vaccineCooldown === 0) {
                this.hivVaccineActive = false;
                this.logEvent('⚠️ Proteção da vacina está diminuindo...');
                this.updateVaccineStatus();
            }
        }
    }

    updatePathogen(pathogen, index) {
        // Comportamento específico do HIV
        if (pathogen.type === 'hiv') {
            this.updateHIV(pathogen, index);
            return;
        }

        // Replicação para outros patógenos
        pathogen.replication++;
        if (pathogen.replication > 300) {
            pathogen.replication = 0;
            this.addPathogen(pathogen.type);
        }

        // Verifica colisão com células de defesa
        for (let j = 0; j < this.cells.length; j++) {
            const defender = this.cells[j];
            if (['macrophage', 'tcell', 'bcell'].includes(defender.type)) {
                const dx = pathogen.x - defender.x;
                const dy = pathogen.y - defender.y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < pathogen.size + defender.size) {
                    pathogen.health -= defender.attack;
                    defender.cooldown = 30;

                    if (pathogen.health <= 0) {
                        this.cells.splice(index, 1);
                        this.logEvent(`${this.getTypeName(pathogen.type)} eliminado!`);
                        break;
                    }
                }
            }
        }
    }

    updateHIV(hiv, index) {
        // Comportamento do HIV - procura especificamente por linfócitos T
        if (!hiv.targetCell) {
            // Encontra o linfócito T mais próximo
            let closestTCell = null;
            let closestDistance = 150;

            for (let j = 0; j < this.cells.length; j++) {
                const cell = this.cells[j];
                if (cell.type === 'tcell' && !cell.infected) {
                    const dx = cell.x - hiv.x;
                    const dy = cell.y - hiv.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);

                    if (distance < closestDistance) {
                        closestDistance = distance;
                        closestTCell = cell;
                    }
                }
            }

            hiv.targetCell = closestTCell;
        }

        // Move em direção ao linfócito T alvo
        if (hiv.targetCell) {
            const dx = hiv.targetCell.x - hiv.x;
            const dy = hiv.targetCell.y - hiv.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < 200) {
                hiv.vx = (dx / distance) * 3;
                hiv.vy = (dy / distance) * 3;
            }

            // Tenta infectar o linfócito T
            if (distance < hiv.size + hiv.targetCell.size) {
                // Células vacinadas são resistentes ao HIV
                if (hiv.targetCell.vaccinated) {
                    hiv.health -= 20; // HIV sofre dano ao tentar infectar célula protegida
                    this.logEvent('🛡️ Célula T vacinada resistiu ao HIV!');
                } else {
                    hiv.targetCell.infected = true;
                    hiv.targetCell.color = '#8e24aa';
                    hiv.targetCell.health -= 2;
                    
                    this.cells.splice(index, 1);
                    this.logEvent('⚠️ ALERTA: Linfócito T infectado pelo HIV!');
                    
                    if (Math.random() < 0.3) {
                        this.addPathogen('hiv');
                    }
                }
            }
        }

        // Replicação do HIV
        hiv.replication++;
        if (hiv.replication > 500) {
            hiv.replication = 0;
            this.addPathogen('hiv');
        }
    }

    updateDefense(defender, index) {
        if (defender.cooldown > 0) {
            defender.cooldown--;
        }

        // Células infectadas não atacam
        if (defender.infected) {
            if (Math.random() < 0.02) {
                defender.vx = (Math.random() - 0.5) * 2;
                defender.vy = (Math.random() - 0.5) * 2;
            }
            return;
        }

        // Procura patógenos próximos
        let closestPathogen = null;
        let closestDistance = 100;

        for (let j = 0; j < this.cells.length; j++) {
            const pathogen = this.cells[j];
            if (['virus', 'bacteria', 'fungus', 'hiv'].includes(pathogen.type)) {
                const dx = pathogen.x - defender.x;
                const dy = pathogen.y - defender.y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < closestDistance) {
                    closestDistance = distance;
                    closestPathogen = pathogen;
                }
            }
        }

        if (closestPathogen && defender.cooldown === 0) {
            const dx = closestPathogen.x - defender.x;
            const dy = closestPathogen.y - defender.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            defender.vx = (dx / distance) * 2;
            defender.vy = (dy / distance) * 2;
        }
    }

    updateAntibodies() {
        for (let i = this.antibodies.length - 1; i >= 0; i--) {
            const antibody = this.antibodies[i];
            
            antibody.x += antibody.vx;
            antibody.y += antibody.vy;

            if (antibody.x < 0 || antibody.x > this.canvas.width) antibody.vx *= -1;
            if (antibody.y < 0 || antibody.y > this.canvas.height) antibody.vy *= -1;

            for (let j = 0; j < this.cells.length; j++) {
                const pathogen = this.cells[j];
                if (['virus', 'bacteria', 'fungus'].includes(pathogen.type)) {
                    const dx = pathogen.x - antibody.x;
                    const dy = pathogen.y - antibody.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);

                    if (distance < pathogen.size + antibody.size) {
                        pathogen.health -= 5;
                        this.antibodies.splice(i, 1);
                        break;
                    }
                }
            }

            this.ctx.fillStyle = antibody.color;
            this.ctx.beginPath();
            this.ctx.arc(antibody.x, antibody.y, antibody.size, 0, Math.PI * 2);
            this.ctx.fill();
        }
    }

    updateSpecializedAntibodies() {
        for (let i = this.specializedAntibodies.length - 1; i >= 0; i--) {
            const antibody = this.specializedAntibodies[i];
            
            antibody.x += antibody.vx;
            antibody.y += antibody.vy;

            if (antibody.x < 0 || antibody.x > this.canvas.width) antibody.vx *= -1;
            if (antibody.y < 0 || antibody.y > this.canvas.height) antibody.vy *= -1;

            // Anticorpos especializados procuram especificamente por HIV
            let closestHIV = null;
            let closestDistance = 100;

            for (let j = 0; j < this.cells.length; j++) {
                const pathogen = this.cells[j];
                if (pathogen.type === 'hiv') {
                    const dx = pathogen.x - antibody.x;
                    const dy = pathogen.y - antibody.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);

                    if (distance < closestDistance) {
                        closestDistance = distance;
                        closestHIV = pathogen;
                    }
                }
            }

            // Move em direção ao HIV mais próximo
            if (closestHIV) {
                const dx = closestHIV.x - antibody.x;
                const dy = closestHIV.y - antibody.y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                antibody.vx = (dx / distance) * 5;
                antibody.vy = (dy / distance) * 5;

                // Neutraliza o HIV
                if (distance < closestHIV.size + antibody.size) {
                    closestHIV.health -= antibody.damage;
                    this.specializedAntibodies.splice(i, 1);
                    
                    if (closestHIV.health <= 0) {
                        this.cells.splice(this.cells.indexOf(closestHIV), 1);
                        this.logEvent('✅ HIV neutralizado por anticorpos especializados!');
                    }
                    break;
                }
            }

            // Desenha anticorpo especializado
            this.ctx.fillStyle = antibody.color;
            this.ctx.beginPath();
            this.ctx.arc(antibody.x, antibody.y, antibody.size, 0, Math.PI * 2);
            this.ctx.fill();

            // Efeito visual especial
            this.ctx.strokeStyle = '#66bb6a';
            this.ctx.lineWidth = 1;
            this.ctx.beginPath();
            this.ctx.arc(antibody.x, antibody.y, antibody.size + 2, 0, Math.PI * 2);
            this.ctx.stroke();
        }
    }

    drawCell(cell) {
        this.ctx.fillStyle = cell.color;
        this.ctx.beginPath();
        this.ctx.arc(cell.x, cell.y, cell.size, 0, Math.PI * 2);
        this.ctx.fill();

        if (cell.cooldown > 0) {
            this.ctx.strokeStyle = '#ffffff';
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.arc(cell.x, cell.y, cell.size + 3, 0, Math.PI * 2);
            this.ctx.stroke();
        }

        if (cell.infected) {
            this.ctx.strokeStyle = '#ff0000';
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.arc(cell.x, cell.y, cell.size + 5, 0, Math.PI * 2);
            this.ctx.stroke();
        }

        // Indicador de célula vacinada
        if (cell.vaccinated) {
            this.ctx.strokeStyle = '#4fc3f7';
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.arc(cell.x, cell.y, cell.size + 7, 0, Math.PI * 2);
            this.ctx.stroke();
        }
    }

    updateStats() {
        const pathogens = this.cells.filter(cell => 
            ['virus', 'bacteria', 'fungus', 'hiv'].includes(cell.type)
        ).length;
        
        const defenses = this.cells.filter(cell => 
            ['macrophage', 'tcell', 'bcell'].includes(cell.type)
        ).length;

        document.getElementById('pathogenCount').textContent = pathogens;
        document.getElementById('defenseCount').textContent = defenses;
        document.getElementById('immunityLevel').textContent = `${Math.round(this.immunityLevel)}%`;
    }

    updateVaccineStatus() {
        const statusElement = document.getElementById('vaccineStatus');
        if (this.hivVaccineActive) {
            statusElement.innerHTML = 'Status: <span class="vaccine-active">✅ Protegido</span>';
        } else {
            statusElement.innerHTML = 'Status: <span class="vaccine-inactive">❌ Não vacinado</span>';
        }
    }

    updateHealth() {
        const pathogens = this.cells.filter(cell => 
            ['virus', 'bacteria', 'fungus', 'hiv'].includes(cell.type)
        ).length;

        const infectedCells = this.cells.filter(cell => 
            cell.infected
        ).length;

        // Bonus de saúde quando vacinado
        const vaccineBonus = this.hivVaccineActive ? 20 : 0;
        this.health = Math.max(0, 100 + vaccineBonus - pathogens * 3 - infectedCells * 8);
        document.getElementById('health').textContent = `${Math.min(100, this.health)}%`;

        if (this.health <= 0) {
            this.running = false;
            this.logEvent('⚠️ SISTEMA IMUNOLÓGICO SOBRECARREGADO! Saúde crítica!');
        }

        if (infectedCells > 2) {
            this.logEvent('🚨 ALERTA: Múltiplas células de defesa infectadas!');
        }
    }

    logEvent(message) {
        const log = document.getElementById('eventLog');
        const entry = document.createElement('div');
        entry.className = 'log-entry';
        entry.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
        log.appendChild(entry);
        
        while (log.children.length > 20) {
            log.removeChild(log.firstChild);
        }
        
        log.scrollTop = log.scrollHeight;
    }

    start() {
        this.running = true;
        this.logEvent('Simulação iniciada! Sistema imunológico ativo.');
    }

    pause() {
        this.running = false;
        this.logEvent('Simulação pausada.');
    }

    reset() {
        this.cells = [];
        this.antibodies = [];
        this.specializedAntibodies = [];
        this.health = 100;
        this.hivVaccineActive = false;
        this.immunityLevel = 0;
        this.vaccineCooldown = 0;
        this.running = false;
        this.init();
        document.getElementById('eventLog').innerHTML = 
            '<div class="log-entry">Sistema reinicializado. Pronto para nova simulação.</div>';
    }
}

// Instância global da simulação
let simulation = new Simulation();

// Event Listeners para botões
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('startBtn').addEventListener('click', () => simulation.start());
    document.getElementById('pauseBtn').addEventListener('click', () => simulation.pause());
    document.getElementById('resetBtn').addEventListener('click', () => simulation.reset());
    document.getElementById('addVirusBtn').addEventListener('click', () => simulation.addPathogen('virus'));
    document.getElementById('addBacteriaBtn').addEventListener('click', () => simulation.addPathogen('bacteria'));
    document.getElementById('addFungusBtn').addEventListener('click', () => simulation.addPathogen('fungus'));
    document.getElementById('addHIVBtn').addEventListener('click', () => simulation.addPathogen('hiv'));
    document.getElementById('addMacrophageBtn').addEventListener('click', () => simulation.addCell('macrophage'));
    document.getElementById('addTCellBtn').addEventListener('click', () => simulation.addCell('tcell'));
    document.getElementById('addBCellBtn').addEventListener('click', () => simulation.addCell('bcell'));
    document.getElementById('addAntibodyBtn').addEventListener('click', () => simulation.addAntibody());
    document.getElementById('vaccineBtn').addEventListener('click', () => simulation.administerHIVVaccine());
});

// Loop de animação
function animate() {
    simulation.update();
    requestAnimationFrame(animate);
}

// Inicia a animação
animate();