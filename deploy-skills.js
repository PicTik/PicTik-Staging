const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Directorio donde están tus archivos .md fuente
const SOURCE_DIR = './source_skills'; 
// Directorio donde se generarán los repositorios
const OUTPUT_DIR = './public_repos';

if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR);

const files = fs.readdirSync(SOURCE_DIR).filter(file => file.endsWith('.md') && file !== 'SKILL.md');

files.forEach(file => {
    const skillName = path.basename(file, '.md').toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const repoPath = path.join(OUTPUT_DIR, skillName);
    const sourceFilePath = path.join(SOURCE_DIR, file);

    console.log(`\nProcesando skill: ${skillName}...`);

    // 1. Crear carpeta del repositorio
    if (!fs.existsSync(repoPath)) fs.mkdirSync(repoPath);

    // 2. Copiar el contenido original
    const content = fs.readFileSync(sourceFilePath, 'utf8');
    fs.writeFileSync(path.join(repoPath, 'knowledge.md'), content);

    // 3. Generar SKILL.md asociado estrictamente al contenido
    // Aquí puedes ajustar la lógica para extraer la descripción dinámica desde el interior del .md
    const skillManifest = `---
name: ${skillName}
description: "Habilidad especializada extraída de ${file}. Contiene reglas y conocimientos técnicos sobre ${skillName.replace(/-/g, ' ')}."
---
# ${skillName.toUpperCase()}
Este repositorio contiene el conocimiento principal para que Manus ejecute tareas relacionadas con ${skillName}.
Consulta knowledge.md para los detalles técnicos.`;
    
    fs.writeFileSync(path.join(repoPath, 'SKILL.md'), skillManifest);

    // 4. Inicializar Git y subir a GitHub como repositorio público
    try {
        execSync('git init', { cwd: repoPath, stdio: 'ignore' });
        execSync('git add .', { cwd: repoPath, stdio: 'ignore' });
        execSync('git commit -m "feat: inicializar skill y conocimiento"', { cwd: repoPath, stdio: 'ignore' });
        
        // Crea el repo público y hace el push inicial
        execSync(`gh repo create ${skillName} --public --source=. --remote=origin --push`, { cwd: repoPath, stdio: 'inherit' });
        console.log(`✅ Repositorio ${skillName} publicado con éxito.`);
    } catch (error) {
        console.error(`❌ Error publicando ${skillName}:`, error.message);
    }
});
