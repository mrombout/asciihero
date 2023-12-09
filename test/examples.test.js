const fs = require('fs')
const { execFileSync } = require('child_process')
const pdf2img = require('pdf-img-convert')
const looksSame = require('looks-same')
const path = require('path')
const chai = require('chai')
const expect = chai.expect

const examplesDir = './examples'
fs.readdirSync(examplesDir).forEach((exampleDir) => {
  const basePath = path.join(examplesDir, exampleDir)
  const adocFile = path.join(basePath, `${exampleDir}.adoc`)
  const expectedOutputFile = path.join(basePath, `${exampleDir}.pdf`)

  const tmpDir = fs.mkdtempSync(path.join(__dirname, exampleDir))
  const actualOutputFile = path.join(tmpDir, `${exampleDir}_actual.pdf`)

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true })
  })

  it(exampleDir, async () => {
    execFileSync('asciihero', [adocFile, '--out-file', actualOutputFile])
    if (process.env.UPDATE) {
      execFileSync('asciihero', [adocFile, '--out-file', expectedOutputFile])
    }

    const pdf2imgOpts = { }
    const expectedOutputImgs = await pdf2img.convert(expectedOutputFile, pdf2imgOpts)
    const actualOutputImgs = await pdf2img.convert(actualOutputFile, pdf2imgOpts)

    // expect(actualOutputImgs, 'number of pages are not the same').to.have.length(expectedOutputImgs.length)
    for (const index in expectedOutputImgs) {
      const expectedPageFile = path.join(tmpDir, `${exampleDir}_${index}.png`)
      const actualPageFile = path.join(tmpDir, `${exampleDir}_actual_${index}.png`)

      fs.writeFileSync(expectedPageFile, expectedOutputImgs[index])
      fs.writeFileSync(actualPageFile, actualOutputImgs[index])

      const expectedOutputImgFile = fs.readFileSync(expectedPageFile)
      const actualOutputImgFile = fs.readFileSync(actualPageFile)

      const { equal, diffImage, differentPixels } = await looksSame(expectedOutputImgFile, actualOutputImgFile, {
        createDiffImage: true,
        ignoreAntialiasing: true,
        tolerance: 2.3
      })

      if (!equal) {
        const diffPageFile = path.join(basePath, `${exampleDir}_${index}_diff.png`)
        await diffImage.save(diffPageFile)

        const expectedPageFileReference = path.join(basePath, `${exampleDir}_${index}.png`)
        fs.copyFileSync(expectedPageFile, expectedPageFileReference)

        const actualPageFileReference = path.join(basePath, `${exampleDir}_actual_${index}.png`)
        fs.copyFileSync(actualPageFile, actualPageFileReference)

        expect(differentPixels, `example ${exampleDir} page ${index} has unexpected changes`).to.equal(0)
      }
    }
  }).timeout(10000)
})
