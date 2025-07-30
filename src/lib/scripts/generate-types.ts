import { compileFromFile } from 'json-schema-to-typescript';
import fs from 'fs/promises';
import path from 'path';

const schemaDir = 'src/lib/schemas';
const outputDir = 'src/lib/types';

async function generateTypes() {
	const files = await fs.readdir(schemaDir);

	await Promise.all(
		files
			.filter((file) => file.endsWith('.schema.json'))
			.map(async (file) => {
				const inputPath = path.join(schemaDir, file);
				const ts = await compileFromFile(inputPath, { bannerComment: '' });

				const interfaceName = file.replace('.schema.json', '.d.ts');
				const outputPath = path.join(outputDir, interfaceName);

				await fs.writeFile(outputPath, ts);
				console.log(`✅ Generated: ${outputPath}`);
			})
	);
}

generateTypes().catch((err) => {
	console.error('❌ Error generating types:', err);
	process.exit(1);
});
