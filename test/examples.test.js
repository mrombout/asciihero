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

    const expectedOutputImgs = await pdf2img.convert(expectedOutputFile)
    const actualOutputImgs = await pdf2img.convert(actualOutputFile)

    expect(actualOutputImgs).to.have.length(expectedOutputImgs.length)
    for (const index in expectedOutputImgs) {
      const expectedPageFile = path.join(tmpDir, `${exampleDir}_${index}.png`)
      const actualPageFile = path.join(tmpDir, `${exampleDir}_actual_${index}.png`)
      const diffPageFile = path.join(basePath, `${exampleDir}_${index}_diff.png`)

      fs.writeFileSync(expectedPageFile, expectedOutputImgs[index])
      fs.writeFileSync(actualPageFile, actualOutputImgs[index])

      const expectedOutputImgFile = fs.readFileSync(expectedPageFile)
      const actualOutputImgFile = fs.readFileSync(actualPageFile)

      const { equal, diffImage, differentPixels } = await looksSame(expectedOutputImgFile, actualOutputImgFile, {
        createDiffImage: true,
        tolerance: 8
      })

      if (!equal) {
        await diffImage.save(diffPageFile)
        expect(differentPixels, `example ${exampleDir} page ${index} has unexpected changes`).to.equal(0)
      }
    }
  }).timeout(10000)
})
