const seedrandom = require('seedrandom')

// segmentTreeProcessor processes all sections with the `segment` style by
// assigning them the right IDs and seting a numeric title.
function segmentTreeProcessor () {
  const self = this

  self.process(function (doc) {
    const segmentNodes = doc.findBy({ context: 'section' }, function (section) {
      return section.sectname === 'segment'
    })

    let sectionIndex = 1
    for (const index in segmentNodes) {
      const node = segmentNodes[index]

      node.setId(node.title)
      node.setTitle(`${sectionIndex}`)
      node.addRole('segment')

      sectionIndex += 1
    }
  })
}

// turnInlineMacro processes the `turn:<target>[]` marge and turns them into cross-references.
function turnInlineMacro () {
  const self = this

  self.process(function (parent, target, attrs) {
    const referencedSegment = parent.document.findBy({ id: target })
    if (referencedSegment.length === 0) {
      parent.getLogger().warn(`segment '${target}' does not exist`)
      return self.createInline(parent, 'quoted', `xref:${target}[${target}]`, { type: 'strong' })
    }

    const segment = referencedSegment[0]
    if (!segment.hasRole('segment')) {
      parent.getLogger().warn(`section '${target}' is not a segment`)
    }

    const title = segment.getTitle()

    return self.createInline(parent, 'quoted', `xref:${target}[${title}]`, { type: 'strong' })
  })
}

// enemyInlineMacro processes the `enemy:<name>[attrs]` macro and turns them into invisible data
// elements to be used by the `combatTreeProcessor.`
function enemyInlineMacro () {
  const self = this

  self.process(function (parent, target, attrs) {
    let name = target
    if (Object.hasOwn(attrs, 'name')) {
      name = attrs.name
      delete attrs.name
    }

    const object = {
      name,
      attributes: attrs
    }
    const content = JSON.stringify(object)

    return self.createInline(parent, 'quoted', content)
  })
}

// combatTreeProcessor processes unordered lists with the `combat` style and
// renders a table with the enemy data.
function combatTreeProcessor () {
  const self = this

  self.process(function (doc) {
    const combatNodes = doc.findBy({ style: 'combat' })

    for (const combatNodeIndex in combatNodes) {
      const combatNode = combatNodes[combatNodeIndex]

      const attributes = doc.getAttribute('asciihero-combat-attributes').split(',').map(x => x.trim())

      let content = '[.combat]\n'
      content += `[cols="${Array(attributes.length + 1).fill('1').join(',')}"]\n`
      content += '|===\n'

      let header = '|\n'
      for (const index in attributes) {
        const attribute = attributes[index]
        header += `| ${attribute}\n`
      }
      content += header
      content += '\n'

      for (const childBlockIndex in combatNode.blocks) {
        const childBlock = combatNode.blocks[childBlockIndex]
        const rawContent = childBlock.getText()

        try {
          const jsonContent = JSON.parse(rawContent)

          content += `|${jsonContent.name}\n`
          for (const attribute in jsonContent.attributes) {
            const value = jsonContent.attributes[attribute]
            content += `| ${value}\n`
          }
        } catch (e) {
          doc.getLogger().warn(`invalid enemy entry in combat block: ${e.message}`)
        }
      }

      content += '|===\n'
      self.parseContent(combatNode.parent, content)

      const nodeIndex = combatNode.parent.blocks.indexOf(combatNode)
      combatNode.parent.blocks.splice(nodeIndex, 1)
    }
  })
}

// choiceInlineMacro processes `choice:<segment_id>[]` macro and turns them into
// invisible data elements to be used by the `choicesTreeProcessor`.
function choiceInlineMacro () {
  const self = this

  self.positionalAttributes(['text'])
  self.process(function (parent, target, attrs) {
    return self.createInline(parent, 'quoted', attrs.text, {})
  })
}

// choicesTreeProcessor processes unordered lists with the `choices` style and
// renders a table with the choices data.
function choicesTreeProcessor () {
  const self = this

  self.process(function (doc) {
    const choicesNodes = doc.findBy({
      style: 'choices'
    })

    for (const choiceNodeIndex in choicesNodes) {
      const choiceNode = choicesNodes[choiceNodeIndex]

      const choices = []
      while (choiceNode.blocks.length > 0) {
        const choice = choiceNode.blocks.pop()
        choices.push(choice)
      }

      let content = '[.choices]\n'
      content += '[cols="10,1,>1"]\n'
      content += '|===\n'

      for (const index in choices.reverse()) {
        const choice = choices[index]

        const regex = /choice:([a-z0-9_]+)/g
        const matches = regex.exec(choice.text)
        const targetLink = matches[1]

        content += `| ${choice.text}\n`
        content += '| Turn to\n'
        content += `| turn:${targetLink}[]\n`
      }

      content += '|===\n'

      self.parseContent(choiceNode.parent, content)
    }

    return doc
  })
}

// shuffleTreeProcessor shuffles all segments according to the
// `asciihero-shuffle-style`.
//
// At the moment only `random` is supported, which shuffled all segments
// randomly.
function shuffleTreeProcessor () {
  const self = this

  const shuffle = function (rng, array) {
    let currentIndex = array.length
    let randomIndex

    // While there remain elements to shuffle.
    while (currentIndex !== 0) {
      // Pick a remaining element.
      randomIndex = Math.floor(rng() * currentIndex)
      currentIndex--;

      // And swap it with the current element.
      [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]]
    }

    return array
  }

  self.process(function (doc) {
    if (doc.getAttribute('asciihero-shuffle-style') !== 'random') {
      return
    }

    const seed = doc.getAttribute('asciihero-shuffle-seed', null)
    const rng = seedrandom(seed)

    // shuffle all nodes
    const gameplayNodes = doc.findBy({ role: 'gameplay' })
    for (const gameplayNodeIndex in gameplayNodes) {
      const gameplayNode = gameplayNodes[gameplayNodeIndex]

      const segmentNodes = gameplayNode.findBy({ context: 'section' }, function (section) {
        return section.sectname === 'segment'
      })

      for (const segmentNodeIndex in segmentNodes) {
        const segmentNode = segmentNodes[segmentNodeIndex]

        const blocksLenth = segmentNode.parent.blocks.length
        const firstOne = segmentNode.parent.blocks[0]
        const lastOne = segmentNode.parent.blocks[blocksLenth - 1]

        shuffle(rng, segmentNode.parent.blocks)

        const firstIndex = segmentNode.parent.blocks.indexOf(firstOne)
        const otherValue1 = segmentNode.parent.blocks[0]
        segmentNode.parent.blocks[0] = firstOne
        segmentNode.parent.blocks[firstIndex] = otherValue1

        const lastIndex = segmentNode.parent.blocks.indexOf(lastOne)
        const otherValue2 = segmentNode.parent.blocks[blocksLenth - 1]
        segmentNode.parent.blocks[blocksLenth - 1] = lastOne
        segmentNode.parent.blocks[lastIndex] = otherValue2
      }
    }

    // re-assign all titles to be in order
    const nodes = doc.findBy({ context: 'section' }, function (section) {
      return section.sectname === 'segment'
    })

    let sectionIndex = 1
    for (const index in nodes) {
      const node = nodes[index]

      node.setTitle(`${sectionIndex}`)
      sectionIndex += 1
    }
  })
}

// dicetableBlockMacro processes the `dicetable:<size>[]` macro and renders a
// table with random numbers. It is intended to be used by the reader as an
// alternative to dice.
function dicetableBlockMacro () {
  const self = this
  self.process(function (parent, target, attrs) {
    const numNumbers = parseInt(target, 10)
    const numbers = Array(numNumbers)
      .fill()
      .map((e, i) => i + 1)
      .sort(() => (Math.random() > 0.5) ? 1 : -1)

    const tableSize = Math.ceil(Math.sqrt(numNumbers))

    let content = '[.dicetable.center]\n'
    content += `[cols="${Array(tableSize).fill('1').join(',')}"]\n`
    content += '|===\n'
    for (let i = 0; i < tableSize; i++) {
      for (let j = 0; j < tableSize; j++) {
        const numberIndex = i * tableSize + j
        content += `|${numbers[numberIndex]}\n`
      }
    }
    content += '|==='
    self.parseContent(parent, content)
  })
}

// attrInlineMacro processes the `attr:<attr>[]` macro and renders an in-line
// reference to an attribute.
function attrInlineMacro () {
  const self = this

  self.process(function (parent, target, attrs) {
    return self.createInline(parent, 'quoted', `<span class="attribute">${target}</span>`)
  })
}

module.exports.register = function (registry) {
  registry.register(function () {
    this.inlineMacro('turn', turnInlineMacro)
    this.inlineMacro('enemy', enemyInlineMacro)
    this.treeProcessor('combat', combatTreeProcessor)
    this.inlineMacro('choice', choiceInlineMacro)
    this.blockMacro('dicetable', dicetableBlockMacro)
    this.inlineMacro('attr', attrInlineMacro)
    this.treeProcessor(segmentTreeProcessor)
    this.treeProcessor(choicesTreeProcessor)
    this.treeProcessor(shuffleTreeProcessor)
  })
}
