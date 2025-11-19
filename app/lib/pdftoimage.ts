export interface PdfConversionResult {
    imageUrl: string;
    file: File | null;
    error?: string;
}

let pdfjsLib: any = null;
let isLoading = false;
let loadPromise: Promise<any> | null = null;

async function loadPdfJs(): Promise<any> {
    if (pdfjsLib) return pdfjsLib;
    if (loadPromise) return loadPromise;

    isLoading = true;
    // @ts-expect-error - pdfjs-dist/build/pdf.mjs is not a module
    loadPromise = import("pdfjs-dist/build/pdf.mjs").then((lib) => {
        // Set the worker source to use local file
        lib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
        pdfjsLib = lib;
        isLoading = false;
        return lib;
    });

    return loadPromise;
}


export async function convertPdfToImage(
    file: File
): Promise<PdfConversionResult> {
    try {
        console.log('Loading pdfjs...');
        const lib = await loadPdfJs();
        console.log('pdfjs loaded:', !!lib);

        console.log('Reading file as arrayBuffer...');
        const arrayBuffer = await file.arrayBuffer();
        console.log('arrayBuffer length:', arrayBuffer.byteLength);

        console.log('Getting PDF document...');
        const pdf = await lib.getDocument({ data: arrayBuffer }).promise;
        console.log('PDF loaded, numPages:', pdf.numPages);

        console.log('Getting first page...');
        const page = await pdf.getPage(1);
        console.log('Page loaded:', !!page);

        const viewport = page.getViewport({ scale: 4 });
        console.log('Viewport:', viewport.width, viewport.height);
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");

        canvas.width = viewport.width;
        canvas.height = viewport.height;

        if (context) {
            context.imageSmoothingEnabled = true;
            context.imageSmoothingQuality = "high";
        } else {
            console.error('Canvas context is null');
        }

        console.log('Rendering page to canvas...');
        await page.render({ canvasContext: context!, viewport }).promise;
        console.log('Page rendered to canvas');

        return new Promise((resolve) => {
            canvas.toBlob(
                (blob) => {
                    if (blob) {
                        const originalName = file.name.replace(/\.pdf$/i, "");
                        const imageFile = new File([blob], `${originalName}.png`, {
                            type: "image/png",
                        });
                        console.log('Image blob created, returning result');
                        resolve({
                            imageUrl: URL.createObjectURL(blob),
                            file: imageFile,
                        });
                    } else {
                        console.error('Failed to create image blob');
                        resolve({
                            imageUrl: "",
                            file: null,
                            error: "Failed to create image blob",
                        });
                    }
                },
                "image/png",
                1.0
            );
        });
    } catch (err) {
        console.error('Error in convertPdfToImage:', err);
        return {
            imageUrl: "",
            file: null,
            error: `Failed to convert PDF: ${err}`,
        };
    }
}