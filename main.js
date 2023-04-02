import asciidoctor from 'asciidoctor' // (1)

const Asciidoctor = asciidoctor()

Asciidoctor.Extensions.register(function (registry) {
    registry.inlineMacro('passage', function () {
        var self = this
        self.process(function (parent, target, attrs) {
            return self.createInline(parent, "quoted", "TBD", { "type": "strong" })
        })
    })
    registry.inlineMacro('choice', function () {
        var self = this
        self.positionalAttributes(["text"])
        self.process(function (parent, target, attrs) {
            return self.createInline(parent, "quoted", attrs.text, { "type": "strong" })
        })
    })
    registry.treeProcessor(function () {
        var self = this;

        self.process(function (doc) {
            var nodes = doc.findBy({ "context": "section" }, function(section) {
                return section.sectname == "section"
            })

            var sectionIndex = 1;
            for(var index in nodes) {
                var node = nodes[index];

                node.setId(node.title)
                node.setTitle(`${sectionIndex}`)
                sectionIndex += 1
            }
        });
    });
//     registry.treeProcessor(function () {
//         var self = this // TreeProcessor
//         self.process(function (doc) {
//             var nodes = doc.findBy({
//                 "style": "choices"
//             })
//             var ulist = nodes[0]

//             var choices = []
//             while (ulist.blocks.length > 0) {
//                 var choice = ulist.blocks.pop()
//                 choices.push(choice)
//             }

//             var content = `[.choices]
// [cols="10,1,>1"]
// |===
// `;
//             for (var index in choices) {
//                 var choice = choices[index]

//                 const regex = /choice:([a-z0-9])/g;
//                 var matches = regex.exec(choice.text)
//                 var target_link = matches[1]

//                 content += `| ${choice.text}
// | Turn to
// | <<${target_link}>>
// `
//             }

//             content += `|===`;

//             self.parseContent(ulist.parent, content)

//             return doc
//         })
//     });
})

var file = "./examples/simple/book.adoc";
var options = {
    "to_file": true,
    "mkdirs": true,
    "attributes": {
        "stylesheet": "../../stylesheet.css"
    }
};

// const doc = Asciidoctor.loadFile(file)
// const res = doc.convert(options);

Asciidoctor.convertFile(file, options)