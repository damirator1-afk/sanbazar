import { execSync } from "node:child_process";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

// Модели от Tripo AI обычно приходят с огромным количеством вершин
// (гофра/резьба смоделированы реальной геометрией, а не текстурой) —
// пример: сифон весом 56 МБ и ~1 млн вершин. Прогоняем через
// gltf-transform (упрощение геометрии + meshopt-компрессия) перед
// загрузкой в Sanity — на тесте давало ~13x уменьшение без заметной
// потери качества на масштабе карточки товара.
//
// Только для локального импорта каталога (шеллится в npx) — НЕ
// подключено к serverless /api/admin/upload-product, там вызов внешнего
// процесса ненадёжен в окружении Vercel. Текстуры (обычно 4096×4096 у
// Tripo, тоже сильно раздувают вес) сюда не входят — упирается в баг
// используемой библиотеки сжатия текстур; уменьшать их пока приходится
// вручную через Blender.
export async function optimizeModel(inputPath: string): Promise<Buffer> {
  const tmpDir = await mkdtemp(path.join(tmpdir(), "sanbazar-model-"));
  const outputPath = path.join(tmpDir, "optimized.glb");
  try {
    // execFileSync can't spawn npx.cmd directly on Windows (EINVAL — .cmd
    // shims need a shell), and execFileSync's shell:true just concatenates
    // array args unescaped, breaking on the spaces in these paths. execSync
    // with args quoted ourselves is the reliable combination on Windows.
    const quote = (s: string) => `"${s.replace(/"/g, '""')}"`;
    const cmd = [
      "npx",
      "--yes",
      "@gltf-transform/cli",
      "optimize",
      quote(inputPath),
      quote(outputPath),
      "--texture-compress",
      "false",
      "--compress",
      "meshopt",
    ].join(" ");
    execSync(cmd, {stdio: "pipe"});
    return await readFile(outputPath);
  } catch (err) {
    console.warn(`  [!] сжатие 3D-модели не удалось, гружу как есть: ${(err as Error).message}`);
    return await readFile(inputPath);
  } finally {
    await rm(tmpDir, {recursive: true, force: true});
  }
}
