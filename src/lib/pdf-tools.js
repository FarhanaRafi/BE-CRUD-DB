import PdfPrinter from "pdfmake";
import imageToBase64 from "image-to-base64";

export const getPDFReadableStream = async (blogsArray) => {
  const fonts = {
    Helvetica: {
      normal: "Helvetica",
      bold: "Helvetica-Bold",
      italics: "Helvetica-Oblique",
      bolditalics: "Helvetica-BoldOblique",
    },
  };
  const printer = new PdfPrinter(fonts);
  const imageBase = await imageToBase64(blogsArray.cover);
  const docDefinition = {
    content: [
      {
        text: blogsArray.title,
        style: "header",
      },
      {
        text: `\n ${blogsArray.category} - ${blogsArray.content}`,
        style: "body",
      },
      // { text: `\n${blogsArray.author.name}\n\n`, style: "body" },
      {
        image: `data:image/jpeg;base64,${imageBase}`,
        width: 500,
        height: 500,
        marginRight: 30,
      },

      "\n \nLorem ipsum dolor sit amet, consectetur adipisicing elit. Confectum ponit legam, perferendis nomine miserum, animi. Moveat nesciunt triari naturam posset, eveniunt specie deorsus efficiat sermone instituendarum fuisse veniat, eademque mutat debeo. Delectet plerique protervi diogenem dixerit logikh levius probabo adipiscuntur afficitur, factis magistra inprobitatem aliquo andriam obiecta, religionis, imitarentur studiis quam, clamat intereant vulgo admonitionem operis iudex stabilitas vacillare scriptum nixam, reperiri inveniri maestitiam istius eaque dissentias idcirco gravis, refert suscipiet recte sapiens oportet ipsam terentianus, perpauca sedatio aliena video.",
    ],
    styles: {
      header: {
        fontSize: 20,
        bold: true,
        color: "red",
        alignment: "center",
      },
      body: {
        fontSize: 14,
        bold: false,
        color: "grey",
        alignment: "center",
      },
    },

    defaultStyle: {
      font: "Helvetica",
    },
  };

  const pdfReadableStream = printer.createPdfKitDocument(docDefinition, {});
  pdfReadableStream.end();

  return pdfReadableStream;
};
