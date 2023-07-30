// GamebookConverter converts an AsciiHero document to a GamebookML document.
module.exports = class GamebookConverter {
  convert (node, transform, opts) {
    const nodeName = transform || node.getNodeName()
    if (nodeName === 'document') {
      return `<gamebook>
        ${node.getContent()}
      </gamebook>`
    }
    if (nodeName === 'section') {
      if (node.hasRole('segment')) {
        return `<segment id="${node.getTitle()}">
          ${node.getContent()}
        </segment>`
      }
      if (node.hasRole('gameplay')) {
        return node.getContent()
      }

      return ''
    }
    if (nodeName === 'inline_quoted') {
      return node.getText()
    }
    if (nodeName === 'inline_anchor') {
      const target = node.getTarget().substring(1)
      const targetNodes = node.getDocument().findBy({ id: target })
      if (targetNodes.length === 0) {
        return '<choice segment="invalid" />'
      }

      return `<choice segment="${targetNodes[0].getTitle()}" />`
    }
    if (nodeName === 'paragraph') {
      return `<text>
        ${node.getContent()}
      </text>`
    }
    if (nodeName === 'ulist') {
      let content = ''

      node.getItems().forEach((item) => {
        content += `${item.getContent()}\n`
      })

      return content
    }
    if (nodeName === 'table') {
      if (node.hasRole('choices')) {
        let content = ''

        node.getRows().getBody().forEach((i) => {
          const text = i[0].getContent()
          const segmentId = i[2].getText().substring('<choice segment="'.length, i[2].getText().length - '" />'.length) // TODO: Remove ugly hack, find better way to get segmentId
          content += `<choice segment="${segmentId}">${text}</choice>\n`
        })

        // console.log(node.getRoles())
        // console.log(node.getRows().getBody()[0][0].getText())
        return content
      }
      if (node.getRoles().includes('combat')) {
        return `<table>
        combat
      </table>`
      }
    }

    // console.log(`node: ${node}`)
    // console.log(`transform: ${transform}`)
    // console.log(`opts: ${opts}`)
    // return node.getContent()
    return 'BLA'
  }
}
