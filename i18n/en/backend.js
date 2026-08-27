const { DEFINES } = require('../../webpack.constants');
const { getRouter } = require("../../router_manager");
const LANG_CODE = 'en';


const messages = {
    langName: "English",
    login: 'Log in',
    signup: 'Sign up',
    logout: 'Log Out',
    share: 'Share',
    shareTool: 'Try this PDF20 tool.',
    uploadAgain: 'Upload Again',
    youMayAlsoNeed: 'You may also need',
    convertToPDF: 'Convert to PDF',
    convertFromPDF: 'Convert from PDF',
    product: 'Product',
    company: 'Company',
    organize: 'Organize',
    optimize: 'Optimize',
    secure: 'Secure',
    edit: 'Edit',
    convert: 'Convert',
    name: 'Name',
    email: 'Email',
    password: 'Password',
    confirmPassword: 'Confirm Password',
    alreadyMember: 'Already member?',
    registerPolicy: 'By creating an account, you agree to %APP_NAME% <a href="' + getRouter(LANG_CODE, 'terms') + '" class="link-red" target="_blank">Terms of Service</a> and <a href="' + getRouter(LANG_CODE, 'privacy') + '" class="link-red" target="_blank">Privacy Policy</a>.',
    dontHaveAccount: 'Don\'t have an account?&nbsp;&nbsp;<a href="' + getRouter(LANG_CODE, 'register') + '" class="link-red fw-500">Create an account</a>',
    account: 'Account',
    upgrade: 'Upgrade',
    send: 'Send',
    back: 'Back',
    more: 'More',
    myDocuments: 'My Documents',
    footText: 'Handle everyday PDF tasks privately in your browser, from conversion and compression to merging, splitting, editing, and signing.',
    filesizeExceedsLimit: 'File size exceeds limit.',
    filetaskExceedsLimit: 'You can not upload any more files.',
    upgradeYourAccount: 'Upgrade your account to unlock more',
    button: {
        back: 'Back to Home',
        allTools: 'All PDF tools',
        choosePDFFiles: 'Choose PDF Files',
        choosePDFFile: 'Choose PDF File',
        chooseImages: 'Choose Images',
        chooseImage: 'Choose Image',
        chooseDocxFiles: 'Choose Word Files',
        chooseExcelFiles: 'Choose Excel Files',
        choosePptFiles: 'Choose PPT Files',
        addFiles: 'Add Files',
        clearAll: 'Clear all',
        chooseFile: 'Choose file'
    },
    upload: {
        upload: 'Upload',
        settings: 'Settings',
        process: 'Process',
        download: 'Download',
        dropFile: 'Drag & drop file here',
        dropFiles: 'Drag & drop files here',
        or: 'Or',
        tips: 'Supported file types: <span class="fw-700" data-file-types>%fileTypes%</span>. You can upload up to <span class="fw-700" data-max-files>%maxFiles%</span> files, and each file must be no larger than <span class="fw-700" data-max-size>%maxSize%</span> MB.',
        security: 'Security & Privacy',
        securityItems: [
            'Your files are processed locally in your browser for supported tools.',
            'Your files are not uploaded to PDF20 servers for conversion.',
            'The processed result is created on your device.',
            'Avoid sensitive documents on public or shared devices because browser cache may keep local data.',
            'Review the Security and Privacy pages for details before handling confidential files.',
        ]
    },
    download: {
        fileIsReady: 'Your file is ready!',
        downMsg: 'Your PDF has been processed successfully.',
        downMsg2: 'Thank you for using PDF20.'
    },
    page: {
        index: {
            name: 'Home',
            meta_title: 'Convert, edit, and manage PDF documents in your web browser',
            meta_keywords: 'PDF online, Online PDF Converter, free PDF converter, online PDF tools, PDF to Word, Word to PDF, compress PDF, merge PDF, split PDF, edit PDF, protect PDF',
            meta_description: 'Use our browser-based PDF tools to convert, compress, merge, split, and edit documents locally without uploading them for processing.',
            heroTitle: 'Work with PDF documents in your web browser',
            heroDesc: 'Private, free, and fast PDF tools for converting, compressing, merging, splitting, and editing files - all handled locally within your web browser.',
            allToolsButton: 'Explore all PDF tools',
            quickConverter: {
                title: 'Convert your file',
                convertTo: 'CONVERT TO',
                next: 'Next',
                pdfOnly: 'Supported: PDF',
                supportedToPdf: 'Supported: DOC, DOCX, XLS, XLSX, CSV, PPT, PPTX, JPG, PNG, WEBP, BMP',
                invalidPdf: 'Please choose a PDF document for this output format.',
                invalidPdfTarget: 'This file type cannot be converted to PDF here.',
                storageError: 'The file could not be saved in your web browser. Please visit the tool and choose it again.'
            },
            editorial: {
                browser: {
                    eyebrow: 'PDF TOOLS THAT GO WHERE YOU DO',
                    title: 'Why use PDF tools in your web browser?',
                    paragraphs: [
                        'Online PDF Converter gives you a straightforward way to manage day-to-day documents with no desktop software to install. Use a modern browser on Windows, macOS, Linux, ChromeOS, a tablet, or a phone and select the task you need.',
                        'Work with PDFs, Word documents, Excel spreadsheets, PowerPoint presentations, and common image formats from a single workspace. Select a file on the homepage, pick the output format, then continue to the appropriate tool to review its options and handle the document.'
                    ],
                    highlights: [
                        'No software installation or manual updates',
                        'Purpose-built tools for converting, organizing, optimizing, editing, and protecting PDFs',
                        'A consistent workflow across desktop and mobile browsers'
                    ]
                },
                workflows: {
                    eyebrow: 'TOOLS FOR EVERYDAY DOCUMENTS',
                    title: 'Fast, focused workflows for everyday PDF tasks',
                    paragraphs: [
                        'Each Online PDF Converter tool is built around one specific task. Select a file, check the available settings, process it in your web browser, and save the finished file without learning a complicated document editor.',
                        'Save PDF pages as images, add a visible watermark, rearrange pages, or split a document into smaller files. Separate tools keep the controls relevant to the task while the overall experience stays consistent.'
                    ],
                    items: [
                        {
                            tool: 'pdf_to_images',
                            title: 'PDF to Images',
                            desc: 'Save PDF pages as JPG, PNG, WebP, or BMP images.'
                        },
                        {
                            tool: 'add_watermark',
                            title: 'Add Watermark',
                            desc: 'Apply text or image watermarks with flexible position and opacity.'
                        },
                        {
                            tool: 'organize_pdf',
                            title: 'Organize pages',
                            desc: 'Arrange, rotate, insert, or delete pages within a focused workspace.'
                        },
                        {
                            tool: 'split_pdf',
                            title: 'Split PDF',
                            desc: 'Split a PDF by page range, individual pages, or fixed-size groups.'
                        }
                    ]
                }
            },
            assurances: [
                {
                    title: 'Files stay on your device',
                    desc: 'Supported tools handle documents on your device instead of sending them to Online PDF Converter servers.'
                },
                {
                    title: 'Runs in your web browser',
                    desc: 'Open Online PDF Converter on desktop or mobile and handle common PDF tasks on your device.'
                },
                {
                    title: 'Begin for free',
                    desc: 'Use everyday PDF tools with no desktop software to install.'
                }
            ],
            popularTools: 'Popular PDF Tools'
        },
        allTools: {
            name: 'All PDF Tools',
            meta_title: 'All PDF Tools | Online PDF Converter',
            meta_keywords: 'organize PDF, Online PDF Converter all tools, merge PDF, split PDF, convert PDF, compress PDF, edit PDF, OCR PDF',
            meta_description: 'Browse all Online PDF Converter tools for merging, splitting, converting, compressing, editing, OCR, organizing, and protecting PDFs.',
        },
        privacy: {
            name: 'Privacy Policy',
            meta_title: 'Privacy Policy | Online PDF Converter',
            meta_keywords: 'local PDF tools, Online PDF Converter privacy policy, PDF privacy, browser PDF processing',
            meta_description: 'Read how Online PDF Converter handles PDF document content, browser-based processing, account data, analytics, cookies, OAuth sign-in, ads, and service logs.'
        },
        openSource: {
            name: 'Open Source',
            meta_title: 'Open Source Software and Licenses | Online PDF Converter',
            meta_keywords: 'Online PDF Converter open source, source code, AGPL license, open source PDF tools',
            meta_description: 'View the Online PDF Converter frontend source code, AGPL license, third-party software notices, repository scope, and branding terms.'
        },
        security: {
            name: 'Security',
            meta_title: 'Secure PDF Tools That Run in Your Browser | Online PDF Converter',
            meta_keywords: 'privacy-focused PDF converter, secure PDF tools, no upload PDF tools, local PDF processing, browser PDF tools',
            meta_description: 'Find out how Online PDF Converter processes supported PDF documents locally within your web browser, what processing PDF files without uploads means, and how to handle sensitive documents safely.',
            heroTitle: 'Secure PDF tools that run in your web browser',
            heroDesc: 'Online PDF Converter uses local browser processing for supported tools, so your documents do not need to be uploaded to our servers for common PDF tasks.',
            ctaPrimary: 'Begin with PDF tools',
            ctaSecondary: 'Read the Privacy Policy',
            sections: [
                {
                    title: 'Why file privacy matters',
                    desc: 'PDFs often contain contracts, invoices, resumes, IDs, medical forms, school documents, financial records, or internal company files. Uploading those files to a random converter can create unnecessary privacy risk.'
                },
                {
                    title: 'What local browser processing means',
                    desc: 'For supported tools, Online PDF Converter uses JavaScript, WebAssembly, and browser APIs to read and process documents on your device. The file content is used for the task in your web browser instead of being uploaded to Online PDF Converter servers for conversion.'
                },
                {
                    title: 'What Online PDF Converter does not do with your files',
                    desc: 'Online PDF Converter does not use the content of the PDF you selected for advertising, does not sell document contents, and does not store your files on Online PDF Converter servers for supported local-processing tools.'
                },
                {
                    title: 'What data Online PDF Converter may collect',
                    desc: 'Like most websites, Online PDF Converter may process website data including cookies, analytics events, IP-based logs, account details, OAuth sign-in information, payments, or support messages. This is separate from the content of the PDF documents you choose for local processing.'
                }
            ],
            safetyTitle: 'Safety tips for shared or public devices',
            safetyItems: [
                'Avoid opening confidential documents on public computers.',
                'Clear browser downloads, history, and site data after handling sensitive files.',
                'Do not leave processed files in a shared Downloads folder.',
                'Use a trusted personal device for legal, HR, finance, or identity documents.',
                'Close the browser tab once you finish a private PDF task.'
            ],
            faq: 'Security FAQ',
            faqItems: [
                {
                    title: 'Are my PDF documents uploaded to Online PDF Converter?',
                    desc: 'For supported tools, no. Files are handled locally within your web browser and do not need to be uploaded to Online PDF Converter servers for conversion.'
                },
                {
                    title: 'Does local processing mean no internet is used?',
                    desc: 'The website and tool code load from the internet, and analytics or account features may connect to online services. For supported tools, the content of the selected file is handled locally.'
                },
                {
                    title: 'Can browser cache store file data?',
                    desc: 'Browsers may keep temporary data, generated results, downloads, or local database entries. Avoid sensitive files on shared devices and clear site data when necessary.'
                },
                {
                    title: 'Where can I read the full policy?',
                    desc: 'The Privacy Policy explains website data, account data, analytics, advertising, OAuth sign-in, logs, and the distinction between file content and service data.'
                }
            ]
        },
        browserExtension: {
            name: "Browser Extension",
            meta_title: "Online PDF Converter Browser Extension - PDF Tools for Chrome and Edge",
            meta_keywords: "no upload PDF converter extension, Online PDF Converter browser extension, PDF converter browser extension, Chrome PDF extension, Edge PDF extension, browser PDF tools",
            meta_description: "Install the Online PDF Converter browser extension for quick access to privacy-focused PDF tools in Chrome and Microsoft Edge for conversion, compression, merging, editing, and signing.",
            heroTitle: "Online PDF Converter Browser Extension",
            heroDesc: "Use the Online PDF Converter tool whenever you like with the Chrome, Edge, or Firefox browser extension.",
            chromeInstallButton: "Install from Chrome Web Store",
            edgeInstallButton: "Install from Microsoft Edge Add-ons",
            firefoxInstallButton: "Install from Firefox Add-ons",
            howToUse: "Using the browser extension",
            howToUseItems: [
                {
                    title: 'Install the extension',
                    desc: "Visit the Chrome Web Store or Microsoft Edge Add-ons listing and add Online PDF Converter to the browser on your device."
                },
                {
                    title: 'Open Online PDF Converter from the toolbar',
                    desc: 'Click the extension icon whenever you need a PDF tool.'
                },
                {
                    title: 'Select a tool',
                    desc: 'Pick a converter, compressor, merge tool, editor, signer, or another PDF workflow.'
                },
                {
                    title: 'Process and download',
                    desc: 'Select documents stored on your device, configure the settings, and save the finished file.'
                }
            ]
        },
        contact: {
            name: 'Contact Us',
            meta_title: 'Contact Us | Online PDF Converter',
            meta_keywords: 'contact Online PDF Converter, PDF tool support, customer questions',
            meta_description: 'Our team is dedicated to providing you with a great user experience. If you have any questions, comments, please contact us.',
            content: 'We highly value the connection with our users, and our customer service team is dedicated to providing you with the best possible service to ensure you have the best experience when with our online tools. <br><br>' +
                'Email us whenever you have a question or concern, and we will be happy to assist. You can also bookmark the website for quick access to our latest services. <br><br>' +
                'Contact us using one of the following methods:<br><br>' +
                'Email: <a href="mailto:%email%">%email%</a>',
        },
        about: {
            name: 'About Us',
            meta_title: 'About Online PDF Converter - Private Online PDF Tools',
            meta_keywords: 'Online PDF Converter about us',
            meta_description: 'Learn about Online PDF Converter, a collection of browser-based PDF tools designed for private, straightforward, and quick document work.',
            content: 'Online PDF Converter provides practical online PDF tools for common document tasks, including converting, compressing, merging, splitting, organizing, securing, editing, and exporting files. Our goal is to make PDF work straightforward enough for anyone to finish in moments without needing additional software.<br><br>' +
                'Your files are handled in your web browser whenever you use our tools. They are not uploaded to our servers for conversion, which helps keep your documents under your control. This makes Online PDF Converter useful for students, office teams, freelancers, small businesses, and anyone who needs to handle documents from their own device.<br><br>' +
                'We focus on clear workflows, readable settings, fast results, and privacy-friendly design. Review our Privacy Policy and Terms of Service for more details, or contact us with questions about the site.',

        },
        ext_install: {
            name: 'Online PDF Converter Extension <strong>Installed!</strong>',
            meta_title: 'Online PDF Converter Extension Installed',
            meta_keywords: 'online PDF tools, Online PDF Converter extension, PDF browser extension',
            meta_description: 'The Online PDF Converter browser extension is installed and ready to provide quick access to browser-based PDF tools on your device.',
            desc: 'You are all set! The Online PDF Converter extension is now installed and ready to help you work with PDF tools faster and smarter.',
            primaryButton: 'Explore Online PDF Converter Tools',
            secondaryButton: 'Begin with Compress PDF',
            sectionTitle: 'What you can do now',
            tipTitle: 'Tip: Pin the extension to your toolbar',
            tipDesc: 'For even quicker access, pin the Online PDF Converter extension to the browser on your device toolbar.',
            tipButton: 'Find out how',
            items: [
                {
                    title: 'Access tools instantly',
                    desc: 'Use the extension shortcut to open Online PDF Converter tools with one click.'
                },
                {
                    title: 'Work with your files',
                    desc: 'Select documents stored on your device and process them securely.'
                },
                {
                    title: 'Your privacy matters',
                    desc: 'Your files stay on your device. We do not store or access them.'
                }
            ]
        },
        ext_uninstall: {
            name: 'Online PDF Converter Extension <strong>Uninstalled</strong>',
            meta_title: 'Online PDF Converter Extension Uninstalled',
            meta_keywords: 'online PDF tools, Online PDF Converter extension uninstall, PDF browser extension uninstalled',
            meta_description: 'The Online PDF Converter browser extension has been uninstalled. You can still use Online PDF Converter online tools directly from the website.',
            desc: 'The Online PDF Converter extension has been uninstalled from the browser on your device. You can still use all Online PDF Converter tools directly on our website whenever you like.',
            primaryButton: 'Use Online PDF Converter Online',
            secondaryButton: 'Contact Us',
            sectionTitle: 'What you should know',
            tipTitle: 'Thanks for trying Online PDF Converter!',
            tipDesc: 'We hope to see you again. All of our PDF tools remain available on the website whenever you need them.',
            tipButton: 'Go to Website',
            items: [
                {
                    title: 'All tools are still online',
                    desc: 'Use conversion, compression, merging, and more directly on Online PDF Converter.'
                },
                {
                    title: 'Your files are safe',
                    desc: 'Uninstalling the extension does not affect your files.'
                },
                {
                    title: 'Need help?',
                    desc: 'If something did not work as expected, we are here to help.'
                }
            ]
        },
        terms: {
            name: 'Terms of Service',
            meta_title: 'Terms of Service | Online PDF Converter',
            meta_keywords: 'Online PDF Converter terms of service',
            meta_description: 'Using ' + DEFINES.DOMAIN + ' indicates that you agree to our terms and conditions. Read this page for the full details.'
        },
        faq: {
            name: 'Common Questions',
            meta_title: 'Common Questions',
            meta_keywords: 'Common Questions',
            meta_description: 'Common Questions'
        },
        cookiePolicy: {
            name: 'Cookie Policy',
            meta_title: 'Cookie Policy | Online PDF Converter',
            meta_keywords: 'Online PDF Converter cookie policy',
            meta_description: "Read more about " + DEFINES.DOMAIN + "'s Cookies."
        },
        error: {
            name: '404',
            meta_title: 'Error 404 | We Could Not Find This Page',
            meta_keywords: 'Online PDF Converter error 404',
            meta_description: 'We Could Not Find This Page',
            title: 'We Could Not Find This Page',
            content: 'The page you are looking for may have been removed, renamed, or is temporarily unavailable.'
        },
        pricing: {
            name: 'Pricing',
            meta_title: 'Pricing Plans - Select the Perfect Plan for You',
            meta_keywords: 'Pricing Tiers, Pricing Plans, Subscription Plans, Pricing Options, Membership Fees',
            meta_description: 'Explore our pricing plans to get maximum flexibility and unlimited access. Select the plan that matches your requirements to unlock the full potential of our services.',
            title: "Select a pricing plan that's right for you",
            level_0: 'Free',
            level_0_btn: 'Start now',
            level_1: 'Premium',
            level_1_btn: 'Go Premium',
            level_2: 'Unlimited',
            level_2_btn: 'Go Unlimited',
            planFeatures: 'Features include',
            month: 'Month',
            monthlyBill: 'Monthly Billing',
            yearlyBill: 'Yearly Billing',
            pricingPlan: 'Pricing Plan',
            comparePlan: 'Compare plan features',
            monthly: 'Monthly',
            yearly: 'Yearly',
            billedYearly: 'Billed annually at <span>%price%</span>',
            service: 'Service',
            devices: 'Devices',
            tools: 'Tools',
            allTools: 'All tools included',
            filesizePerTask: 'Filesize per task',
            batchProcess: 'Batch processing',
            maxFilesPerTask: 'Maximum files per task',
            maxFileSizePerTask: 'Maximum file size per task',
            unlimited: 'Unlimited',
            limitedDocSize: 'Limited document size',
            limitedDocProcess: 'Limited document processing',
            workLargerDocSize: 'Work with larger documents',
            moreProcessTask: 'More processing tasks',
            unlimitedDocSize: 'Unlimited document size',
            unlimitedDocProcess: 'Unlimited document processing',
            customerSupport: 'Customer support',
            pricingDesc: 'Discover our three pricing plans: Free, Premium, and Unlimited. Begin with our Free plan to experience our basic features for free. Upgrade to our Premium plan for enhanced benefits and exclusive features. For maximum flexibility and unlimited access, our Unlimited plan offers limitless possibilities. Select the plan that works for you and unlock the full potential of our services. Sign up today and enjoy the benefits of your chosen pricing plan.',
            frequentlyAsk: 'Common Questions',
            askQuestionTitle_1: 'What are the payment methods available?',
            askQuestionContent_1: 'We accept payment through PayPal, Visa, MasterCard, Discover, American Express, and more.',
            askQuestionTitle_2: 'Can I cancel my subscription?',
            askQuestionContent_2: 'Yes. You may cancel your subscription whenever you no longer need the service.',
            askQuestionTitle_3: 'How will the charges be deducted?',
            askQuestionContent_3: 'We offer payment options on a monthly or annual basis, and the charges will be automatically deducted from the payment method you selected at the time of subscription, on the next billing cycle.',
            simpleDesc: 'Begin for free and upgrade whenever you need more. Select the Online PDF Converter plan that works best for you.'
        },
        merge_pdf: {
            name: 'Merge PDF',
            meta_title: 'Merge PDF Files into One Document | Online PDF Converter',
            meta_keywords: 'selected page range merge, merge PDF documents, combine PDFs, join PDF documents, reorder PDF documents',
            meta_description: 'Upload PDF documents, arrange them in the required order, select page ranges when necessary, and generate a single combined PDF.',
            desc: 'Combine separate PDFs into a single file. Arrange files before generating the result and include only the selected page ranges you choose.',
            seo: [
                {
                    title: 'How to Merge PDF Files',
                    content: `Upload two or more files, and drag the file items to change the display order of the merged files.<br><br>
                    <span class="fw-700">Check page orientation before merging.</span> If some source PDFs are landscape and others portrait, the merged file will keep each page's original orientation rather than standardizing it.<br><br>
                    <span class="fw-700">Remove unwanted pages first.</span> If a source file has pages you don't want in the final document, use [Split PDF](/split-pdf) or a page-delete tool to trim it down before merging.<br><br>
                    <span class="fw-700">Double-check file order.</span>Since the merged output follows the order you set, it's best to preview the thumbnail arrangement again before generating the result.`,
                }
            ],
            faq: [
                {
                    title: 'How many PDFs can I merge at once?',
                    content: 'Merge multiple PDF documents in one operation and arrange them in any order. The number of files and the size of each file depend on your subscription plan.'
                },
                {
                    title: 'Will merging affect the quality of my PDFs?',
                    content: "No. Merging only combines pages into one file - it doesn't re-compress or alter the content, so text, images, and formatting remain precisely as they were in each source file."
                },
                {
                    title: 'Can I reorder pages once merging, or only before?',
                    content: 'Page order is set before generating the result, based on how you arrange the file thumbnails. To reorder pages afterward, upload the merged file again, use [Split PDF](/split-pdf) to extract and rearrange sections, then merge them again.'
                },
                {
                    title: 'Can I merge PDFs with various page sizes or orientations?',
                    content: "Yes. Pages keep their original size and orientation after merging - this tool doesn't force every page into a uniform layout."
                },
                {
                    title: 'Is it possible to merge password-protected PDFs?',
                    content: "You'll need to unlock or remove the password from any protected file before merging, since this tool needs to read the page content directly."
                },
                {
                    title: 'Can I split a merged PDF back into individual files later?',
                    content: "Yes. Open [Split PDF](/split-pdf) whenever you want to divide a merged document into individual files or extract specific pages."
                }
            ],
        },
        compress_pdf: {
            name: "Compress PDF",
            meta_title: 'Compress PDF Size with Adjustable Levels | Online PDF Converter',
            meta_keywords: 'image compression PDF, compress PDF, reduce PDF size, shrink PDF document, PDF optimizer',
            meta_description: 'Reduce PDF document size with selectable compression levels and optional metadata cleanup, then download the smaller result.',
            desc: 'Select a compression strength, process one or more PDFs, and download reduced-size files or a ZIP package.',
            qualitySmall: 'Smaller file',
            qualitySmallDesc: 'Use stronger compression whenever you need a noticeably smaller PDF for sharing or uploading.',
            qualityBalanced: 'Balanced',
            qualityBalancedDesc: 'A good everyday choice that reduces size while keeping documents easy to read.',
            qualityBetter: 'Better quality',
            qualityBetterDesc: 'Use lighter compression when sharp text, images, and layout details matter more.',
            qualityExtreme: 'Maximum quality',
            qualityExtremeDesc: 'Use the lightest compression when preserving sharp images, text, and layout details matters most.',
            qualityCustom: 'Custom compression',
            qualityCustomDesc: 'Select the structure compression, image resolution, and JPEG quality that fit your needs.',
            structure: 'Structure',
            structureStrong: 'Strong',
            structureMedium: 'Medium',
            structureLight: 'Light',
            structureNone: 'None',
            customStructure: 'Structure compression',
            customStructureHelp: 'Stronger structure compression can reduce file size without lowering image resolution.',
            customDpi: 'Image resolution',
            customDpiHelp: 'Lower DPI creates smaller files but reduces image detail.',
            customImageQuality: 'Image quality',
            customImageQualityHelp: 'Lower image quality applies stronger JPEG compression.',
            removeMetadata: 'Remove editable metadata where possible',
            seo: [
                {
                    title: 'Will the content of a document change once PDF compression?',
                    content: 'Compression primarily reduces file size and generally does not alter the number of pages, text content, or original layout of a PDF. However, images, scanned pages, or other large files may be reprocessed. After compression, check image clarity, font display, and page layout for accuracy.'
                },
                {
                    title: 'Select a Compression Level That Matches Your Needs',
                    content: 'Various documents require different levels of compression. A balanced setting is a practical starting point for everyday files, while lighter compression is better when image quality and fine details matter. Stronger compression can be useful when reducing the file size is the main priority, but the result should always be reviewed before it is shared or submitted.'
                },
                {
                    title: 'Reduce File Size Without Rebuilding the Document',
                    content: 'There is no need to recreate the PDF, remove pages manually, or export the document through another application. Add the existing file, select the preferred compression setting, and process it directly. This tool focuses on optimizing the PDF so the document becomes smaller without changing its intended content.'
                },
                {
                    title: 'Suitable for Text Documents, Images, and Scanned Pages',
                    content: 'PDF documents can contain text, embedded fonts, photographs, charts, illustrations, or full-page scans. The amount of space that can be saved depends on how the original document was created. Image-heavy and scanned PDFs often have more room for reduction, while files that were already optimized may show a smaller difference.'
                },
                {
                    title: 'Review Important Details After Compression',
                    content: 'Compression can affect documents differently, especially when they contain small text, signatures, stamps, diagrams, or high-resolution images. After processing, check the pages at normal size and while zoomed in. This is particularly important for documents that will be printed, archived, signed, or formally submitted.'
                }
            ],
            faq: [
                {
                    title: 'Why is my PDF still large once compression?',
                    content: 'The source file may already contain compressed images or optimized resources, leaving less data to reduce. Embedded fonts, vector graphics, attachments, detailed illustrations, and complex page elements can also keep the file size relatively high even after compression.'
                },
                {
                    title: 'Why do some PDFs shrink over others?',
                    content: 'Compression results depend on the contents and internal structure of the document. A PDF filled with high-resolution photographs may shrink considerably, while a document made mostly of text and vector graphics may change very little. Files previously optimized by another application can also have limited room for further reduction.'
                },
                {
                    title: 'Why do images look different once compression?',
                    content: 'Images may be resized, recompressed, or stored with fewer visual details to reduce the overall file size. The difference is normally more noticeable in photographs, gradients, screenshots, and scanned pages. A lighter setting is preferable when image clarity is more important than achieving the smallest possible result.'
                }
            ]
        },
        repair_pdf: {
            name: 'Repair PDF',
            meta_title: 'Repair PDF - Fix Damaged PDF Files Online | Online PDF Converter',
            meta_keywords: 'Rebuild PDF, Repair PDF, Fix PDF, Recover PDF, Damaged PDF Repair, Corrupted PDF Repair',
            meta_description: 'Repair damaged or malformed PDF documents online in your web browser. Rebuild PDF structure with local qpdf processing and download a repaired copy without uploading the source file.',
            desc: 'Try to repair damaged, malformed, or hard-to-open PDF documents. The browser-based repair engine rebuilds the PDF structure locally and saves a new repaired copy.',
            seo: [
                {
                    title: 'Repair a PDF With a Broken File Structure',
                    content: 'Try the PDF repair tool when a document cannot be opened, produces a format error, or fails to load correctly in a PDF reader. It attempts to read the remaining document data and rebuild it as a usable PDF when recovery is possible.'
                },
                {
                    title: 'Repair Results Depend on the Remaining PDF Data',
                    content: 'This tool can only work with information that is still readable inside the file. It may recover a document with structural errors, but it cannot guarantee the return of content that has been deleted, overwritten, or damaged beyond recognition.'
                }
            ],
            faq: [
                {
                    title: 'When should I try repairing a PDF?',
                    content: 'Repair is worth trying when a PDF refuses to open, displays an invalid-file message, stops loading unexpectedly, or cannot be processed by another PDF tool. These problems may indicate that the document structure is incomplete or malformed.'
                },
                {
                    title: 'What does the PDF repair process attempt to fix?',
                    content: 'It attempts to rebuild the internal structure that PDF readers use to locate and display pages and document content. This tool does not rewrite the document or create replacement content that is no longer present in the original file.'
                },
                {
                    title: 'Can this tool recover content that has been deleted?',
                    content: 'No repair tool can recreate data that is completely absent from the file. Recovery is only possible when the affected pages or objects still exist and can be read well enough to contain in the rebuilt PDF.'
                },
                {
                    title: 'Why might a damaged PDF still fail to repair?',
                    content: 'The file might be missing essential structural information, contain severely corrupted page data, or be incomplete because a download or transfer was interrupted. In these cases, there may not be enough readable information to build a valid replacement.'
                }
            ]
        },
        ocr_pdf: {
            name: 'OCR PDF',
            meta_title: 'OCR PDF Online - Make Scanned PDFs Searchable | Online PDF Converter',
            meta_keywords: 'PDF to text, OCR PDF, searchable PDF, scanned PDF OCR, extract PDF text',
            meta_description: 'Recognize text in scanned PDFs locally within your web browser. Download a searchable PDF that preserves the original pages or export the recognized text as a TXT file.',
            desc: 'Turn a scanned PDF into a searchable document or plain text file. Recognition runs locally and retains your original PDF pages unchanged.',
            languages: 'OCR languages',
            languagesHelp: 'Hold Ctrl or Cmd to select multiple languages.',
            outputFormat: 'Output format',
            searchablePdf: 'Searchable PDF',
            textFile: 'Plain text file',
            accuracy: 'Recognition quality',
            accuracyStandard: 'Standard (192 DPI)',
            accuracyHigh: 'High (288 DPI)',
            accuracyUltra: 'Ultra (384 DPI)',
            seo: [
                {
                    title: 'Convert Scanned Pages Into Searchable PDF or Plain Text',
                    content: 'Select an output that matches what you need to do next. A searchable PDF preserves the original pages available for viewing while making recognized text easier to find, while plain text is better when you mainly want to extract wording for notes, editing, or reuse.'
                },
                {
                    title: 'Choose the Correct Language Before Recognition',
                    content: 'Choosing the language used in the document helps the OCR engine interpret letters, accents, punctuation, and word patterns more accurately. Multiple languages can be selected for PDFs that contain bilingual text or sections written in various languages.'
                },
                {
                    title: 'Keep the Original Page Appearance',
                    content: 'OCR focuses on recognizing the words shown on each page rather than redesigning the document. The original PDF pages remain visually unchanged, making searchable PDF output suitable whenever you want to preserve scans, signatures, stamps, illustrations, and existing page formatting.'
                }
            ],
            faq: [
                {
                    title: 'Why might the OCR language matter?',
                    content: 'Languages use various character sets, accents, punctuation rules, and word patterns. Selecting the correct language gives the recognition engine better context. A mismatched language can cause valid characters to be interpreted as similar-looking letters or symbols.'
                },
                {
                    title: 'Can I recognize a PDF containing several languages?',
                    content: 'Yes. The language selector allows several languages to be chosen. Select every language that appears meaningfully in the document, but avoid adding unrelated languages because a more focused selection can reduce ambiguity during recognition.'
                },
                {
                    title: 'Why are some words recognized incorrectly?',
                    content: 'Recognition errors are more likely when pages are blurred, tilted, low-resolution, heavily compressed, stained, faint, or photographed under uneven lighting. Unusual fonts, text over images, narrow columns, stamps, and handwritten notes can also make characters harder to identify.'
                },
                {
                    title: 'Can OCR recognize handwritten text?',
                    content: 'OCR is generally more reliable with clear printed or typed text. Neat handwriting may be partially recognized, but results can vary considerably between writing styles. Handwritten names, signatures, notes, and numbers should be checked manually instead of treated as exact transcriptions.'
                }
            ]
        },
        split_pdf: {
            name: 'Split PDF',
            meta_title: 'Split PDF by Range, Page, Odd, or Even Pages | Online PDF Converter',
            meta_keywords: 'extract PDF parts, split PDF, separate PDF pages, PDF range splitter, odd even PDF pages',
            meta_description: 'Split a single PDF into smaller files by selected page range, every page, fixed page groups, odd pages, or even pages.',
            desc: 'Choose how a single PDF should be divided, from custom ranges to every page or fixed-size page groups.',
            modeRange: 'Extract selected page ranges',
            modeRangeDesc: 'Generate a single PDF from page ranges such as 1-3, 7, and 12-15.',
            modeEveryPage: 'Split every page',
            modeEveryPageDesc: 'Save each page as a separate PDF and download them as a ZIP file.',
            modeEveryN: 'Split every N pages',
            modeEveryNDesc: 'Create smaller PDF documents with the same number of pages in each file.',
            modeOdd: 'Extract odd pages',
            modeOddDesc: 'Generate a single PDF containing pages 1, 3, 5, and so on.',
            modeEven: 'Extract even pages',
            modeEvenDesc: 'Generate a single PDF containing pages 2, 4, 6, and so on.',
            prompt: 'Selected pages will be converted into separate PDF documents. <span class="fw-700"><span data-selected-pages>0</span> of <span data-total-pages>0</span> pages</span> selected, <span  class="fw-700"><span data-pdfs>0</span> PDFs</span> will be created.',
            seo: [
                {
                    title: 'How to Split a PDF',
                    content: `<span class="fw-700">Select how to split it.</span> Pick a mode based on what you need:
                        <ul class="p-0 list-style-none">
                            <li class="mb-5"><span class="fw-700">Split by selected page range:</span> extract specific pages (e.g., pages 3–7) into a new file.</li>
                            <li class="mb-5"><span class="fw-700">Split every N pages:</span> break a long document into equal chunks (e.g., every 5 pages becomes its own PDF).</li>
                            <li class="mb-5"><span class="fw-700">Extract individual pages:</span> pull out one or more single pages as separate files.</li>
                            <li><span class="fw-700">Split by odd or even pages:</span> in moments separate pages based on their order.</li>
                        </ul>
                    `
                }
            ],
            faq: [
                {
                    title: 'Will splitting affect the quality of my PDF?',
                    content: "No. Splitting only separates pages - it doesn't re-compress, re-render, or alter the content, so text, images, and formatting stay exactly as they were in the source file."
                },
                {
                    title: 'Can I split a PDF into over two files at once?',
                    content: 'Yes. Using "split every N pages" or "extract individual pages," a single PDF can be divided into as many files as needed, delivered together in a ZIP file.'
                },
                {
                    title: 'Do I need to know the exact page numbers in advance?',
                    content: "No - the page thumbnail preview lets you visually select pages or ranges before confirming, so you don't need to know page numbers ahead of time."
                },
                {
                    title: 'Is it possible to put the split pages back together afterward?',
                    content: "Yes. Use [Merge PDF](/merge-pdf) to recombine any of the finished files into a single document again."
                },
                {
                    title: 'Why did I get a ZIP file instead of a PDF?',
                    content: "When splitting produces multiple output files - for example, extracting several individual pages - they are bundled into a ZIP for one download. If you extract only a single page or range, you will receive a PDF directly."
                },
                {
                    title: 'Is it possible to split a scanned or image-based PDF?',
                    content: "Yes. Splitting works on the page level regardless of whether the content is text or scanned images, so it doesn't require OCR - the pages are separated precisely as they appear."
                },
            ]
        },
        pdf_to_word: {
            name: 'PDF to Word',
            meta_title: 'Convert PDF to DOCX with Text and Layout Options | Online PDF Converter',
            meta_keywords: 'PDF document conversion, PDF to Word, PDF to DOCX, editable PDF text, visual PDF layout',
            meta_description: 'Export PDF pages as DOCX using editable text extraction or visual layout mode.',
            desc: 'Generate a Word document from PDF pages and choose between editable content and layout-focused output.',
            seo: [
                {
                    title: 'Why Convert PDF to Word',
                    content: "PDF is built for consistent viewing and printing, not for editing - text, tables, and images are fixed in place. Converting to Word (.docx) turns that static layout back into an editable document. <br><br>The converted Word document retains the text, images, and page formatting, and stays editable."
                }
            ],
            faq: [
                {
                    title: 'Will the formatting stay the same once conversion?',
                    content: 'Simple, text-based PDFs normally convert cleanly. Complex layouts - multi-column pages, embedded tables, or PDFs made from scanned images - may need manual adjustment afterward, especially in editable text mode.'
                },
                {
                    title: 'Is it possible to convert a scanned PDF to Word?',
                    content: "Yes, but scanned pages are essentially images, so this tool needs to recognize the text first. For scanned documents, use Online PDF Converter's [OCR PDF](/ocr-pdf) tool before converting, or select an OCR-enabled option if offered, so the text becomes selectable and editable."
                },
                {
                    title: 'Why might my converted document have extra spacing or broken lines?',
                    content: "This normally happens with PDFs that use non-standard fonts, unusual character encoding, or complex table structures. Try the other conversion mode (editable text vs. layout-focused) - one often handles the source PDF better than the other."
                },
                {
                    title: 'Can I convert several PDFs into one Word document?',
                    content: "Currently each file converts to its own separate DOCX. If you need a single PDF made of several files, use [Merge PDF](/merge-pdf) first, then convert the combined file."
                }
            ]
        },
        pdf_to_excel: {
            name: 'PDF to Excel',
            meta_title: 'Extract PDF Tables into Excel XLSX | Online PDF Converter',
            meta_keywords: 'PDF data rows, PDF to Excel, PDF tables to XLSX, extract table PDF, spreadsheet from PDF',
            meta_description: 'Find tables or text rows on chosen PDF pages and export them into an XLSX workbook.',
            desc: 'Convert table-like PDF content into spreadsheet sheets with detected rows and columns preserved.',
            seo: [
                {
                    title: 'Convert PDF Tables Into an Excel Spreadsheet',
                    content: 'Extract table-like content from a PDF and turn it into an editable Excel file. Detected rows and columns are organized into spreadsheet cells, making it easier to work with reports, statements, inventories, schedules, and other documents that contain structured data.'
                },
                {
                    title: 'Preserve the Detected Row and Column Structure',
                    content: 'The converter analyzes table-like areas and attempts to retain their row and column relationships in the spreadsheet output. Clear tables with consistent spacing and visible boundaries generally provide a more usable result than pages with overlapping text or irregular layouts.'
                }
            ],
            faq: [
                {
                    title: 'What type of PDF works best for Excel conversion?',
                    content: 'PDFs with clear tables, consistent columns, readable text, and predictable spacing are the best candidates. Financial tables, item lists, schedules, and structured reports normally convert more cleanly than pages built from scattered text boxes or complex visual layouts.'
                },
                {
                    title: 'Does this tool convert the entire PDF layout into Excel?',
                    content: 'This tool focuses on table-like content and detected rows and columns. Paragraphs, illustrations, decorative elements, headers, and the exact visual design of the PDF may not be reproduced in the same way inside the spreadsheet.'
                },
                {
                    title: 'Can an image-only scanned PDF be converted?',
                    content: 'The page describes the extraction of table-like PDF content but does not state that OCR is included. If a page contains only scanned images instead of readable PDF text, the table may not be detected accurately and may need OCR before conversion.'
                }
            ]
        },
        pdf_to_ppt: {
            name: 'PDF to PowerPoint',
            meta_title: 'Convert PDF Pages to PowerPoint Slides | Online PDF Converter',
            meta_keywords: 'PDF presentation output, PDF to PowerPoint, PDF to PPTX, PDF slide converter, page to slide',
            meta_description: 'Turn chosen PDF pages into PPTX slides with slide size, image quality, and page number options.',
            desc: 'Make a presentation file from PDF pages, with one rendered page placed on each slide.',
            seo: [
                {
                    title: 'Convert PDF Pages Into PowerPoint Slides',
                    content: 'Turn a PDF into a PowerPoint presentation with each document page placed on its own slide. This is useful when a report, handout, proposal, or visual document needs to be presented in slide format without rebuilding every page manually.'
                },
                {
                    title: 'Keep the Existing PDF Page Appearance',
                    content: 'Each PDF page is rendered for the corresponding slide, helping preserve the visible layout, fonts, images, charts, and spacing. The result is designed to resemble the source document instead of recreate every page element as a separate PowerPoint object.'
                }
            ],
            faq: [
                {
                    title: 'How is each PDF page added to PowerPoint?',
                    content: 'Each PDF page is rendered and placed on a separate slide. A ten-page PDF therefore produces a presentation based on ten page slides, following the source document order.'
                },
                {
                    title: 'Will the source PDF text be editable in PowerPoint?',
                    content: 'The converted page is placed on the slide as rendered content, so the source text, images, and shapes are not rebuilt as separate editable PowerPoint elements. You can still add new text boxes, shapes, or other objects on top of the slide.'
                },
                {
                    title: 'Does the conversion preserve the PDF layout?',
                    content: 'The rendered-page approach is intended to retain the visible appearance of the PDF, including its text placement, graphics, and page design. It does not reconstruct the source application layout or editable objects used to create the document.'
                }
            ]
        },
        pdf_to_images: {
            name: 'PDF to Images',
            meta_title: 'Export PDF Pages as JPG, PNG, or WebP | Online PDF Converter',
            meta_keywords: 'image output PDF, PDF to images, PDF page export, PDF to JPG PNG WebP, render PDF pages',
            meta_description: 'Render chosen PDF pages as JPG, PNG, or WebP images with resolution, quality, and layout controls.',
            desc: 'Customize resolution, quality, and layout. Choose between saving each page individually or combining several pages into a single image.',
            resolution: 'Resolution',
            resolutionLow: '72 DPI (Low)',
            resolutionMedium: '144 DPI (Medium)',
            resolutionHigh: '216 DPI (High)',
            resolutionVeryHigh: '288 DPI (Very High)',
            outputFormat: 'Output Format',
            formatJpg: 'JPG',
            formatPng: 'PNG',
            formatWebp: 'WebP',
            formatBmp: 'BMP',
            quality: 'Image Quality',
            qualityHelp: 'Quality applies to JPG and WebP output. Higher values keep more detail and create larger files.',
            layoutTitle: 'Page Layout',
            layoutCustom: 'Custom',
            layoutHelp: 'Use 1x1 to export each page separately, or choose a grid to place multiple PDF pages in one image.',
            layoutColumns: 'Columns',
            layoutRows: 'Rows',
            seo: [
                {
                    title: 'Convert PDF Pages Into JPG, PNG, or WebP Images',
                    content: 'Turn each page of a PDF into an image for use in presentations, websites, messages, design tools, or applications that do not accept PDF documents. Choose JPG, PNG, or WebP according to the format required by your next workflow.'
                },
                {
                    title: 'Select a Resolution That Keeps Content Readable',
                    content: 'Adjust the resulting file resolution based on how the images will be viewed. A higher resolution is useful for pages containing small text, detailed diagrams, or content that may be enlarged, while a lower setting produces more compact images for quick previews and everyday sharing.'
                },
                {
                    title: 'Balance Image Detail and File Size',
                    content: 'When exporting as JPG or WebP, use the quality control to decide how much visual detail to retain. Higher values can retain text edges, photographs, and graphics clearer, while lower values create smaller images that may show more compression.'
                },
                {
                    title: 'Export Pages Separately or Combine Them in a Grid',
                    content: 'Use the 1x1 layout to generate a separate image from each PDF page. Select a preset grid or define custom rows and columns when several pages need to appear together in one image, including a contact sheet, document overview, or visual summary.'
                }
            ],
            faq: [
                {
                    title: 'What does the resolution setting change?',
                    content: 'Resolution affects the dimensions and visible detail of the exported pages. Higher settings can make small text and fine graphics easier to read when enlarged, but they also produce larger image files. Choose a resolution that matches the intended viewing size.'
                },
                {
                    title: 'Why might the quality slider not affect PNG output?',
                    content: 'The page applies the quality setting only to JPG and WebP exports. Changing that value will therefore not alter PNG output. Use the resolution setting whenever you need to change the level of detail in a PNG image.'
                },
                {
                    title: 'How do I save every PDF page as a individual image?',
                    content: 'Select the 1x1 page layout before generating the result the document. Each PDF page will then be exported individually rather than being placed together with other pages in a larger combined image.'
                },
                {
                    title: 'How can I combine several PDF pages into one image?',
                    content: 'Choose a grid layout such as 2x1, 1x2, 2x2, or 3x3. For a various arrangement, select the custom option and enter the required number of columns and rows.'
                }
            ]
        },
        pdf_to_jpg: {
            name: 'PDF to JPG',
            meta_title: 'Export PDF Pages as JPG Images | Online PDF Converter',
            meta_keywords: 'PDF thumbnail image, PDF to JPG, PDF JPEG export, render PDF to image, JPG page output',
            meta_description: 'Convert chosen PDF pages into JPG images with adjustable resolution and quality.',
            desc: 'Save PDF pages as JPG images with options for resolution, quality, and layout. Choose to produce one image per page or combine multiple pages into a single image.',
            seo: [
                {
                    title: 'Convert PDF Pages Into JPG Images',
                    content: 'Turn document pages into widely supported JPG files for websites, presentations.'
                },
                {
                    title: 'Adjust Resolution and JPG Quality Separately',
                    content: 'Resolution controls the dimensions and sharpness of the rendered page, while JPG quality controls how strongly the resulting image is compressed. Increase both when small text and detailed graphics must stay clear, or use more moderate settings for lightweight previews.'
                },
                {
                    title: 'Create Individual Images or a Multi-Page Grid',
                    content: 'Export every page as a individual JPG, or arrange several pages together in rows and columns. Grid layouts are useful for contact sheets and document overviews, while individual images are better when pages must remain readable or be used independently.'
                }
            ],
            faq: [
                {
                    title: 'Which resolution should I choose?',
                    content: 'Use a lower resolution for quick previews and small on-screen images. Select a higher resolution when the page contains fine print, detailed diagrams, screenshots, or content that may be enlarged. Higher resolution also produces larger JPG files.'
                },
                {
                    title: 'What does the JPG quality setting change?',
                    content: 'JPG quality affects how much image detail is retained during compression. A higher value normally produces cleaner text edges and fewer visible artifacts, while a lower value reduces the file size but may soften details or create block-like patterns.'
                }
            ]
        },
        pdf_to_png: {
            name: 'PDF to PNG',
            meta_title: 'Export PDF Pages as PNG Images | Online PDF Converter',
            meta_keywords: 'PDF screenshot PNG, PDF to PNG, PNG page export, transparent PDF image, render PDF PNG',
            meta_description: 'Render chosen PDF pages into PNG images with resolution and transparency options.',
            desc: 'Export PDF pages as PNG images with adjustable resolution and layout. Choose to produce one image per page or combine multiple pages into a single image.',
            seo: [
                {
                    title: 'Convert PDF Pages to PNG Images',
                    content: 'Export PDF pages as PNG files, rendering each page as an image while preserving its visible text, graphics, and layout.'
                },
                {
                    title: 'Keep Text and Graphics Clear in PNG Output',
                    content: 'PNG uses lossless image compression, making it a practical choice for pages containing small text, screenshots, diagrams, interface elements, or sharp lines. It avoids the block-like compression artifacts that can show in heavily compressed JPG images.'
                }
            ],
            faq: [
                {
                    title: 'When should I select PNG instead of JPG?',
                    content: 'PNG is a good choice for pages containing text, diagrams, screenshots, tables, or graphics with sharp edges. JPG may produce smaller files for photographic pages, but its compression can introduce visible artifacts around letters and fine lines.'
                },
                {
                    title: 'Why is the PNG file larger than expected?',
                    content: 'PNG preserves image data without lossy compression, so detailed pages can produce relatively large files. Higher output resolution also creates more pixels. Reduce the resolution when the image only needs to be viewed at a smaller size.'
                }
            ]
        },
        pdf_to_webp: {
            name: 'PDF to WebP',
            meta_title: 'Export PDF Pages as WebP Images | Online PDF Converter',
            meta_keywords: 'PDF web image, PDF to WebP, WebP page export, render PDF WebP, compressed PDF image',
            meta_description: 'Convert chosen PDF pages into WebP images with quality and resolution settings.',
            desc: 'Save PDF pages as WebP images with adjustable quality and resolution. Choose to produce one image per page or combine multiple pages into a single image.',
            seo: [
                {
                    title: 'Convert PDF Pages Into WebP Images',
                    content: 'Render PDF pages as WebP images for websites, online previews, and other projects. The images retain visible text, graphics, and page layout.'
                }
            ],
            faq: [
                {
                    title: 'When is WebP a useful output format?',
                    content: 'WebP is particularly useful when PDF pages will be displayed on a website or inside a web-based application. It offers adjustable image compression and is supported by major modern browsers, making it a practical option for online previews and visual content.'
                }
            ]
        },
        pdf_to_pdfa: {
            name: 'PDF to PDF/A',
            meta_title: 'Convert PDF to PDF/A Archive Format | Online PDF Converter',
            meta_keywords: 'PDF preservation, PDF to PDF/A, PDF/A converter, archival PDF, convert to PDF/A',
            meta_description: 'Convert a PDF into a PDF/A-style file with settings aimed at long-term document preservation.',
            desc: 'Generate a PDF/A output from an existing PDF while preserving the page content as much as possible.',
            level1b: 'Basic conformance with the widest legacy compatibility.',
            level2b: 'Recommended for most archives, with better support for modern PDFs.',
            level3b: 'Allows embedded files while keeping PDF/A archival behavior.',
            embedFonts: 'Embed all fonts where possible',
            flattenTransparency: 'Flatten transparency when necessary',
            seo: [
                {
                    title: 'Convert a PDF Into an Archival PDF/A File',
                    content: 'Prepare documents for long-term storage, record keeping, or workflows that specifically require PDF/A. The conversion creates an archival version designed to preserve the document’s visible appearance while reducing its dependence on features that may not stay reliable in the future.'
                },
                {
                    title: 'Select the PDF/A Level Required by Your Workflow',
                    content: 'Select PDF/A-1b for broad compatibility with older archival systems, PDF/A-2b for most modern archiving needs, or PDF/A-3b when the archival file must also support embedded attachments. When an organization specifies a particular level, use that exact option instead of choosing based only on compatibility.'
                },
                {
                    title: 'Flatten Transparency When Archival Compatibility Requires It',
                    content: 'Transparency effects in graphics, shadows, overlays, or layered page elements may need to be simplified during PDF/A conversion. The flattening option can replace those effects with a more stable page representation, although complex artwork should be checked afterward for visible changes.'
                }
            ],
            faq: [
                {
                    title: 'What is PDF/A used for?',
                    content: 'PDF/A is intended for documents that need to remain viewable over a long period, including business records, legal files, institutional submissions, and archival collections. It limits or modifies PDF features that could depend on external resources or future software behavior.'
                },
                {
                    title: 'Which PDF/A level should I choose?',
                    content: 'Select the level requested by the archive, agency, customer, or document management system receiving the file. When no level is specified, PDF/A-2b is the page’s recommended option for most archives. PDF/A-1b favors older compatibility, while PDF/A-3b supports embedded files.'
                },
                {
                    title: 'What is the difference between PDF/A-1b and PDF/A-2b?',
                    content: 'PDF/A-1b offers basic visual conformance and is useful when compatibility with older archival systems is important. PDF/A-2b is designed for more modern PDF documents and generally handles current document features more effectively, making it the practical default for many archives.'
                },
                {
                    title: 'When should I use PDF/A-3b?',
                    content: 'Use PDF/A-3b when the archived PDF needs to retain embedded files as part of the document package. This may be useful when a PDF must contain related source data or supporting files. Confirm that the receiving archive accepts PDF/A-3b before choosing it.'
                },
                {
                    title: 'What does flattening transparency do?',
                    content: 'Flattening converts transparent or overlapping visual effects into a more fixed page representation. This can improve compatibility with archival requirements, but it may slightly change shadows, gradients, blending, or layered artwork. Review graphically complex pages once conversion.'
                },
                {
                    title: 'Does converting to PDF/A prove that a document is legally valid?',
                    content: 'No. PDF/A is an archival file standard, not proof of authorship, authenticity, approval, or legal validity. Digital signatures, records policies, retention procedures, and submission rules are individual requirements that may still apply.'
                }
            ]
        },
        word_to_pdf: {
            name: 'Word to PDF',
            meta_title: 'Turn Word Documents to PDF',
            meta_keywords: 'Word export PDF, Word to PDF, DOCX to PDF, DOC to PDF, document PDF converter',
            meta_description: 'Convert DOCX or DOC documents into fixed PDF output.',
            desc: 'Turn Word documents into PDF format while preserving layout, fonts, and images.',
            seo: [
                {
                    title: 'Why Turn Word to PDF',
                    content: "Word documents are easy to edit, but that flexibility becomes a liability once a document needs to be shared, signed, or archived - formatting can shift between devices, fonts may not be installed on the recipient's computer, and anyone with Word can still change the content. Converting to PDF locks the layout in place."
                },
                {
                    title: 'What Happens to Your Formatting',
                    content: "Online PDF Converter renders your Word document using its actual layout engine, so fonts, spacing, page breaks, headers, footers, images, and tables are kept consistent with the original file. If a font used in your document isn't available on your system, a close substitute may be used - for exact font fidelity, ensure the fonts are installed locally before converting."
                }
            ],
            faq: [
                {
                    title: 'Will my formatting, fonts, and images stay precisely the same?',
                    content: 'In most cases, yes - the PDF is generated from how the document renders on your device. Uncommon or unlicensed fonts, and documents with heavy custom formatting, are the most likely to shift slightly.'
                },
                {
                    title: 'Does this work with both .doc and .docx files?',
                    content: 'Yes, both older Word formats (.doc) and the modern format (.docx) are supported.'
                },
                {
                    title: 'Do I need Microsoft Word installed to use this tool?',
                    content: "No. Conversion happens in your web browser, so you don't need Word or any other software installed."
                },
                {
                    title: 'Can I convert several Word documents into a single PDF?',
                    content: "Each file converts into its own individual PDF. If you need to combine several PDFs into one, convert them individually first, then use <a href=\"/merge-pdf\">Merge PDF</a> to join them."
                },
                {
                    title: "Why does my PDF look various from what I see in Word?",
                    content: "This can happen if your document uses fonts, styles, or add-ins not available on your device. Try converting from a device with the source fonts installed, or check the document in Word's \"Print Preview\" first - it typically matches how the PDF will render."
                },
                {
                    title: 'Can I edit the PDF once converting?',
                    content: "The converted PDF is a fixed-layout document, similar to a printed page. If you need to make changes, use <a href=\"/edit-pdf\">Edit PDF</a> to add text, images, or annotations, or convert it back with <a href=\"/pdf-to-word\">PDF to Word</a>."
                }
            ]
        },
        excel_to_pdf: {
            name: 'Excel to PDF',
            meta_title: 'Convert Spreadsheets to PDF Pages | Online PDF Converter',
            meta_keywords: 'worksheet export, Excel to PDF, XLSX to PDF, spreadsheet PDF, CSV to PDF',
            meta_description: 'Convert XLSX, XLS or CSV spreadsheets into PDF pages with rendered sheet content.',
            desc: 'Render spreadsheet content into PDF pages while keeping sheet structure visible in the resulting file.',
            seo: [
                {
                    title: 'Turn Excel Spreadsheets Into PDF Pages',
                    content: 'Turn XLSX, XLS, or CSV files into PDF documents for easier viewing, printing, and distribution. Spreadsheet content is rendered into fixed pages while keeping the visible table structure clear in the resulting document.'
                },
                {
                    title: 'Keep Rows, Columns, and Sheet Content Visible',
                    content: 'The conversion is designed to retain the visible organization of the spreadsheet, including its rows, columns, labels, and displayed values. This makes the resulting file easier to compare with the source file than manually copying the data into a separate document.'
                }
            ],
            faq: [
                {
                    title: 'Which spreadsheet formats can I convert?',
                    content: 'This tool accepts XLSX and XLS workbooks as well as CSV files. Keep in mind that CSV stores plain tabular data and does not contain the full formatting, formulas, multiple sheets, or visual elements available in an Excel workbook.'
                },
                {
                    title: 'Will formulas stay editable in the PDF?',
                    content: 'No. The PDF is a fixed representation of the spreadsheet instead of an editable workbook. Displayed formula results may appear as page content, but the underlying formulas cannot be recalculated or changed inside the PDF.'
                }
            ]
        },
        ppt_to_pdf: {
            name: 'PowerPoint to PDF',
            meta_title: 'Convert Presentations to PDF Slides | Online PDF Converter',
            meta_keywords: 'slide export, PowerPoint to PDF, PPTX to PDF, PPT to PDF, presentation PDF',
            meta_description: 'Convert PPTX or PPT presentations into PDF pages, one slide per page.',
            desc: 'Export presentation slides into PDF pages while preserving the slide order.',
            seo: [
                {
                    title: 'Turn PowerPoint Slides Into PDF Pages',
                    content: 'Turn PPTX or PPT presentations into PDF documents while keeping the slides in their original order. The converted file is easier to open, print, submit, and share with people who do not need to edit the presentation.'
                }
            ],
            faq: [
                {
                    title: 'Which PowerPoint file types can I convert?',
                    content: 'This tool supports PPTX and PPT presentation files. PPTX is the current PowerPoint format, while PPT is commonly used by older versions of presentation software.'
                },
                {
                    title: 'Will animations and transitions show in the PDF?',
                    content: 'No. PDF pages are static, so slide transitions, entrance effects, motion paths, and other timed animations do not play. The converted page shows the visible slide state instead of the sequence of animated steps used during a presentation.'
                }
            ]
        },
        images_to_pdf: {
            name: 'Images to PDF',
            meta_title: 'Build a PDF from JPG, PNG, and WebP Images | Online PDF Converter',
            meta_keywords: 'picture to PDF, images to PDF, JPG PNG WebP PDF, image PDF maker, combine images PDF',
            meta_description: 'Combine JPG, PNG, and WebP files into a single PDF with image ordering and page layout options.',
            desc: 'Add mixed image formats, arrange the sequence, set layout options, and export a single PDF.',
            chooseImageFiles: 'Choose Image Files',
            pageSize: 'Page Size',
            pageSizeLetter: 'Letter',
            pageSizeLegal: 'Legal',
            pageSizeFit: 'Fit to Image',
            orientation: 'Orientation',
            orientationAuto: 'Auto (match image)',
            orientationPortrait: 'Portrait',
            orientationLandscape: 'Landscape',
            margin: 'Margin',
            marginNone: 'None',
            marginSmall: 'Small (0.25")',
            marginMedium: 'Medium (0.5")',
            marginLarge: 'Large (1")',
            seo: [
                {
                    title: 'Merge Images into a Single PDF',
                    content: 'Merge JPG, JPEG, PNG, WebP, and BMP images into a single PDF document, including a mix of supported image formats in the same file.'

                },
                {
                    title: 'Arrange Images in the Correct Page Order',
                    content: 'Arrange the image order before generating the PDF so that the final document follows the intended order.'

                },
                {
                    title: 'Select the Appropriate Page Size and Orientation',

                    content: 'Set the PDF page size and orientation based on the shape of the images and their intended use.'

                },
            ],
            faq: [
                {
                    title: 'Which image formats can be converted to PDF?',
                    content: 'This tool supports JPG, JPEG, PNG, WebP, and BMP images. Different supported formats can be included in the same PDF, so the source images do not all need to use the same file type.'
                },
                {
                    title: 'Can I combine different image formats in a single PDF?',
                    content: 'Yes. As an example, JPG photographs, PNG screenshots, and WebP graphics can be arranged together and exported as a single document. Review the sequence before generating the result to ensure the mixed files appear in the intended order.'
                },

            ]
        },
        jpg_to_pdf: {
            name: 'JPG to PDF',
            meta_title: 'Generate a PDF from JPG Images',
            meta_keywords: 'image PDF, JPG to PDF, JPEG to PDF, photo PDF maker, JPG page layout',
            meta_description: 'Add JPG or JPEG images, reorder them, choose page size, orientation, margins, and generate a PDF.',
            desc: 'Turn JPG images into PDF pages with control over order, page size, margins, and scaling.',
            seo: [
                {
                    title: 'Merge JPG Images into a Single PDF File',
                    content: 'Merge JPG and JPEG images into an easy-to-organize PDF document for easier reading, printing, and management.'
                },
                {
                    title: 'Control Margins and Image Position',
                    content: 'Adjust page margins and scaling settings to control how each JPG image is displayed on its PDF page. Add whitespace when formal documents need borders, or reduce margins to give images more room.'
                }
            ]
        },
        png_to_pdf: {
            name: 'PNG to PDF',
            meta_title: 'Turn PNG Images into PDF Pages | Online PDF Converter',
            meta_keywords: 'image PDF pages, PNG to PDF, transparent PNG PDF, PNG page layout, combine PNG files',
            meta_description: 'Convert PNG files to PDF pages with ordering, page size, orientation, margin, and scaling controls.',
            desc: 'Place PNG images into a PDF while keeping the page order and layout choices under your control.',
            seo: [
                {
                    title: 'Convert PNG Images to PDF Documents',
                    content: 'Use our online PNG to PDF converter to convert multiple PNG files to PDF or merge them into a single PDF document.',
                }
            ],
            faq: [
                {
                    title: 'How is the PDF page order determined?',
                    content: 'The PDF follows the prepared order of the PNG images. Check the sequence before generating the result, especially when the images represent consecutive pages, numbered instructions, or steps that must be read in a particular order.'
                },
                {
                    title: 'What does the margin setting change?',
                    content: 'The margin controls the space around each PNG inside its PDF page. A larger margin creates a wider border, while a smaller margin allows the image to occupy more of the page. Check content near the edges before choosing a narrow margin.'
                }
            ]
        },
        webp_to_pdf: {
            name: 'WebP to PDF',
            meta_title: 'Convert WebP Images into a PDF | Online PDF Converter',
            meta_keywords: 'image converter, WebP to PDF, WebP image PDF, combine WebP files, WebP page layout',
            meta_description: 'Add WebP images, arrange their order, select page settings, and export them as PDF pages.',
            desc: 'Collect WebP images into a PDF and tune the page layout before generating the result.',
            seo: [
                {
                    title: 'Turn WebP Images Into a PDF Document',
                    content: 'Convert or merge multiple WebP images into PDF files in one operation with the online converter. '
                },
                {
                    title: 'What is WebP?',
                    content: 'WebP is a modern web image format introduced by Google, with the file extension .webp. Its main feature is that it generally takes up less space than JPG, PNG, and GIF while maintaining similar visual quality, thus allowing web pages to load faster.'
                }
            ]
        },
        heic_to_pdf: {
            name: 'HEIC to PDF',
            meta_title: 'Convert HEIC and HEIF Images to PDF | Online PDF Converter',
            meta_keywords: 'Apple image PDF, HEIC to PDF, HEIF to PDF, HEIC image PDF, convert HEIC photos',
            meta_description: 'Decode HEIC or HEIF images, place them into PDF pages, and adjust page size, orientation, and margins.',
            desc: 'Convert HEIC or HEIF images to PDF while adjusting page layout, orientation, and margins.',
            seo: [
                {
                    title: 'Convert HEIC to PDF online',
                    content: 'Quickly convert HEIC images to PDF for easy viewing, sharing, printing, and archiving on different devices. It supports merging multiple HEIC images into a single PDF document; no software installation is required, the process is simple, and it preserves the original image quality as much as possible.',
                },
                {
                    title: 'What is HEIC?',
                    content: 'HEIC is a high-efficiency image format commonly found on iPhones and iPads. The file extension is generally .heic. It is based on the HEIF container and usually uses HEVC encoding to compress images.'
                }
            ],
            faq: [
                {
                    title: 'Can both HEIC and HEIF files be converted?',
                    content: 'Yes. The converter accepts images with either the HEIC or HEIF extension. These files can be turned into PDF pages without first converting them to JPG or PNG.'
                }
            ]
        },
        psd_to_pdf: {
            name: 'PSD to PDF',
            meta_title: 'Convert PSD Composite Preview to PDF | Online PDF Converter',
            meta_keywords: 'PSD converter, PSD to PDF, Photoshop PSD PDF, PSD composite image, design file PDF',
            meta_description: 'Read the provided composite preview from a PSD file and place it into PDF pages with layout options.',
            desc: 'Generate a PDF from the flattened preview stored inside a PSD file when that preview is available.',
            seo: [
                {
                    title: 'Convert PSD Designs Into PDF Pages',
                    content: 'Turn Photoshop design files into PDF documents for review, presentation, or archiving. The converter uses the readable composite image stored in each PSD to generate a fixed page that shows the combined appearance of the design.'
                },
                {
                    title: 'Share a Design Without Requiring Photoshop',
                    content: 'Generate a PDF copy that clients, colleagues, and reviewers can open without working with the original PSD file. '
                },
                {
                    title: 'Generate a Fixed Preview, Not an Editable Photoshop File',
                    content: 'The PDF contains the rendered appearance of the PSD instead of its original layer structure. Text layers, masks, adjustment layers, smart objects, and other Photoshop components are combined into the composite preview and cannot be edited separately in the resulting PDF.'
                }
            ],
            faq: [
                {
                    title: 'What part of the PSD is converted to PDF?',
                    content: 'This tool uses the readable composite image stored inside the PSD. This composite represents the combined visible appearance of the design rather than exposing each Photoshop layer as a separate PDF element.'
                },
                {
                    title: 'Why can some PSD files not be converted?',
                    content: 'Conversion may fail when the PSD does not contain a readable composite image or when the browser cannot render the available preview data. Saving the file again from Photoshop with compatibility data included may generate a more usable source file.'
                }
            ]
        },
        tiff_to_pdf: {
            name: 'TIFF to PDF',
            meta_title: 'Convert TIFF and Multi-Page TIF to PDF | Online PDF Converter',
            meta_keywords: 'TIFF converter, TIFF to PDF, TIF to PDF, multi-page TIFF PDF, scanned TIFF PDF',
            meta_description: 'Convert TIF or TIFF images, including multi-page files, into PDF pages with layout settings.',
            desc: 'Read TIFF files page by page and write them into a PDF with page size and margin options.',
            seo: [
                {
                    title: 'Convert TIFF and multi-page TIFF files to PDF',
                    content: "Convert TIFF images to paginated PDF documents that can be opened in standard document readers. Multi-page TIFF files will be processed page by page.<br><br>TIFF, or TIF, is an image file containing one or more images. It's similar to other more common image formats like JPG and PNG, but differs in that it can hold multiple images, and sometimes even other file types. This format is very popular among photographers and graphic designers because it allows them to package multiple related images into a single uncompressed file for transmission."
                }
            ],
            faq: [
                {
                    title: 'Can a multi-page TIFF be converted to a single PDF?',
                    content: 'Yes. The converter reads a TIFF file page by page and places its image pages into the PDF. Review the finished document to confirm that every page is present and follows the expected sequence.'
                }
            ]
        },
        rtf_to_pdf: {
            name: 'RTF to PDF',
            meta_title: 'Convert RTF Documents to PDF | Online PDF Converter',
            meta_keywords: 'formatted text PDF, RTF to PDF, Rich Text to PDF, RTF document converter, text file PDF',
            meta_description: 'Convert Rich Text Format files into PDF documents while preserving basic formatting.',
            desc: 'Turn RTF content into a PDF with its text formatting carried into the generated pages.',
            seo: [
                {
                    title: 'Convert RTF to PDF',
                    content: `Convert Rich Text Format documents into PDF documents for easier sharing, printing, and consistent viewing. <br><br>
                            RTF, or Rich Text Format, is a document format developed for exchanging formatted content between different word-processing applications. An RTF file can contain styled text, fonts, colors, paragraphs, tables, pictures, page breaks, and other document elements.<br><br>
                            Converting an RTF document to PDF creates a more stable copy that is easier to share with people who may not use the same word processor. PDF also helps keep the document’s page sequence and general appearance consistent across supported devices.`
                }
            ]
        },
        odt_to_pdf: {
            name: 'ODT to PDF',
            meta_title: 'Convert ODT Documents to PDF | Online PDF Converter',
            meta_keywords: 'ODT export, ODT to PDF, OpenDocument to PDF, ODT document converter, text document PDF',
            meta_description: 'Open an ODT file, render the document layout, and generate a PDF copy.',
            desc: 'Change OpenDocument Text files into PDF output while keeping the document structure readable.',
            seo: [
                {
                    title: 'Convert ODT Documents Into PDF',
                    content: 'ODT is an open-source word-processing format associated with OpenOffice and StarOffice and supported across major operating systems. Its XML-based files can contain formatted document content and losslessly compressed images. Converting ODT to PDF makes the document easier to open without a compatible office application.'
                }
            ]
        },
        xps_to_pdf: {
            name: 'XPS to PDF',
            meta_title: 'Convert XPS and OXPS Documents to PDF | Online PDF Converter',
            meta_keywords: 'Microsoft XPS PDF, XPS to PDF, OXPS to PDF, fixed layout PDF, XPS document converter',
            meta_description: 'Render XPS or OXPS pages and save the fixed-layout result as a PDF.',
            desc: 'Transform XPS pages into PDF pages while preserving the fixed page layout.',
            seo: [
                {
                    title: 'Why convert XPS to PDF?',
                    content: 'XPS (XML Paper Specification) files are very similar to PDFs. They are also standala single documents and look identical on any system capable of opening them. However, the biggest difference is that the XPS file format is owned by Microsoft, requiring you to install specific software to visit them, while PDFs are supported by most browsers, making conversion to PDF the more convenient method for viewing.'
                }
            ]
        },
        epub_to_pdf: {
            name: 'EPUB to PDF',
            meta_title: 'Convert EPUB Files to PDF | Online PDF Converter',
            meta_keywords: 'ebook to PDF, EPUB to PDF, ebook PDF conversion, EPUB renderer, EPUB pages',
            meta_description: 'Load an EPUB file, render its content into pages, and export the result as a PDF.',
            desc: 'Transform EPUB content into a paged PDF while keeping readable text output where possible.',
            seo: [
                {
                    title: 'Convert an EPUB E-Book Into a Paged PDF',
                    content: 'Turn EPUB content into a PDF with fixed pages for reading, printing, reference, or use in document-based workflows. The converter processes the e-book content and retains text readable in the PDF where possible.'
                },
                {
                    title: 'Generate a Fixed-Layout Copy of Reflowable Content',
                    content: 'EPUB files can configure their text layout to different screens, while PDF documents use defined pages. Converting the file creates a paged version, so paragraphs, headings, images, and page breaks may be arranged differently from the original e-book reader view.'
                }
            ],
            faq: [
                {
                    title: 'What changes when an EPUB is converted to PDF?',
                    content: 'The reflowable e-book content is placed into fixed PDF pages. Because EPUB readers can change font size and screen layout dynamically, the pagination and line wrapping in the PDF may not match what you previously saw in an e-book application.'
                },
                {
                    title: 'Why does the PDF have a various number of pages?',
                    content: 'EPUB files do not have one permanent page count because their content reflows based on the reader, screen size, and text settings. PDF conversion creates fixed pages, so a new page count is calculated from the rendered content.'
                },
                {
                    title: 'Will the PDF look precisely like my e-book reader?',
                    content: 'Not necessarily. E-book applications may apply their own fonts, spacing, themes, margins, and reading settings. The converter renders the EPUB into a paged document, so line breaks, paragraph spacing, and image placement can differ.'
                },
                {
                    title: 'Why are some paragraphs split across pages?',
                    content: 'The converter must divide continuous EPUB content into fixed PDF pages. A paragraph, list, image caption, or other section may cross a page boundary when it does not fit entirely within the remaining page space.'
                }
            ]
        },
        mobi_to_pdf: {
            name: 'MOBI to PDF',
            meta_title: 'Convert MOBI, AZW, and AZW3 to PDF | Online PDF Converter',
            meta_keywords: 'ebook converter, MOBI to PDF, AZW to PDF, AZW3 to PDF, Kindle format PDF',
            meta_description: 'Process MOBI, AZW, or AZW3 files without DRM and export the rendered content as PDF pages.',
            desc: 'Turn supported Kindle-format files into a paged PDF output.',
            seo: [
                {
                    title: 'Convert a MOBI E-Book Into a Paged PDF',
                    content: 'Turn a MOBI e-book into a PDF with fixed pages for reading, printing, reference, or use in document-based workflows. The conversion makes the book easier to open in applications that work with PDF documents rather than e-book formats.'
                },
                {
                    title: 'Generate a Fixed-Page Version of Reflowable Content',
                    content: 'MOBI books can adapt their text layout to various screens and reader settings. Converting the book to PDF creates a defined page sequence, so paragraphs, headings, images, and chapter breaks remain in fixed positions.'
                }
            ],
            faq: [
                {
                    title: 'What changes when a MOBI file is converted to PDF?',
                    content: 'The flexible e-book layout is arranged into fixed PDF pages. Text no longer reflows automatically when the viewing window or font size changes, and the converted document receives a stable page count and page sequence.'
                },
                {
                    title: 'Why might the PDF layout differ from my e-book reader?',
                    content: 'E-book readers can apply their own fonts, text sizes, margins, line spacing, and screen dimensions. The PDF converter creates a individual paged layout, so line wrapping, paragraph length, image placement, and chapter pagination may differ.'
                }
            ]
        },
        fb2_to_pdf: {
            name: 'FB2 to PDF',
            meta_title: 'Convert FB2 to PDF | Online PDF Converter',
            meta_keywords: 'ebook PDF, FB2 to PDF, FictionBook PDF',
            meta_description: 'Read FB2 files, render the book structure, and generate a PDF.',
            desc: 'Convert FictionBook content into a PDF with chapters and text rendered into pages.',
            seo: [
                {
                    title: 'Convert an FB2 E-Book Into a Paged PDF',
                    content: 'Turn FictionBook content into a PDF with chapters and text arranged across fixed pages. '
                },
                {
                    title: 'Create Stable Page References From E-Book Content',
                    content: 'FB2 books adapt their text layout to the reading application and screen size. PDF conversion creates a defined page sequence.'
                }
            ],
            faq: [
                {
                    title: 'What changes when an FB2 file becomes a PDF?',
                    content: "The book's chapters and text are arranged into fixed PDF pages. Unlike an FB2 reader, the PDF will not continuously reflow its paragraphs when the window size or reading settings change."
                }
            ]
        },
        cbz_to_pdf: {
            name: 'CBZ to PDF',
            meta_title: 'Convert CBZ Image Archives to PDF | Online PDF Converter',
            meta_keywords: 'CBZ pages, CBZ to PDF, comic archive PDF, image archive converter',
            meta_description: 'Extract images from a CBZ, preserve their sorted order, and write them as PDF pages.',
            desc: 'Turn an image archive into a PDF by reading each image file in sequence.',
            seo: [
                {
                    title: 'Convert a CBZ Image Archive Into PDF',
                    content: 'Turn the images stored in a CBZ archive into a paged PDF document. Each image becomes part of the resulting PDF, making comic pages, scanned artwork, and other image sequences easier to open in a standard PDF reader.'
                }
            ],
            faq: [
                {
                    title: 'Will text in the comic become selectable?',
                    content: 'No. Speech bubbles, captions, and other words stay part of the page images. OCR must be applied separately when text inside the converted PDF needs to become searchable or selectable.'
                },
                {
                    title: 'Can the converter individual comic panels?',
                    content: 'No. Each source image is treated as a complete page. This tool does not detect, crop, rearrange, or enlarge individual comic panels within an image.'
                }
            ]
        },
        djvu_to_pdf: {
            name: 'DJVU to PDF',
            meta_title: 'Convert DJVU and DJV Files to PDF | Online PDF Converter',
            meta_keywords: 'DJVU pages, DJVU to PDF, DJV to PDF, DjVU document converter, scanned document PDF',
            meta_description: 'Render pages from DJVU or DJV files and export them as a standard PDF.',
            desc: 'Convert DjVu pages into a PDF so the file can be opened with standard PDF software.',
            seo: [
                {
                    title: 'Why convert DjVu to PDF?',
                    content: 'Due to the widespread adoption of PDF, most people no longer save documents in DjVu format. However, you may still have some older DjVu files that you need to open. You are able to download a DjVu reader, but converting it to PDF might be more convenient. This way, you are able to open it with a familiar program.<br><br>Similarly, the Internet Archive used to scan public domain books using DjVu files to make them freely available online. The Internet Archive stopped this practice in 2016, but many scanned books in DjVu format still exist. You may have found one of these and want to convert it to PDF for reading on an e-reader.'
                }
            ],
        },
        markdown_to_pdf: {
            name: 'Markdown to PDF',
            meta_title: 'Markdown to PDF | Online PDF Converter',
            meta_keywords: 'styled Markdown PDF, Markdown to PDF, MD to PDF',
            meta_description: 'Convert Markdown to PDF online for free. Easily transform MD files into beautifully styled, print-ready PDF documents in seconds.',
            desc: 'A simple and efficient tool to convert Markdown text or files into professionally styled PDF documents.',
            seo: [
                {
                    title: 'Convert Markdown Files Into Styled PDF Documents',
                    content: 'Turn Markdown content into a readable PDF while retaining the structure defined in the source file. Headings, paragraphs, lists, emphasis, and other supported elements are rendered as a finished document instead of raw markup.'
                },
                {
                    title: 'Create Shareable Documents From Markdown',
                    content: 'Convert notes, technical documentation, project instructions, drafts, and other Markdown content into a fixed PDF. The result is easier to distribute because recipients do not need a Markdown editor.'
                },
                {
                    title: 'Keep the Source Simple and Easy to Update',
                    content: 'Continue writing and maintaining the source content as a Markdown file, then generate a new PDF whenever the text changes.'
                }
            ],
            faq: [

                {
                    title: 'Will Markdown symbols show in the PDF?',
                    content: 'Supported Markdown syntax is rendered as document formatting rather than displayed as raw characters. As an example, heading markers and emphasis symbols are interpreted when the structure is recognized correctly.'
                },
                {
                    title: 'Why does the PDF look various from my Markdown editor?',
                    content: 'Markdown editors can use various themes, fonts, spacing rules, and rendering engines. The PDF converter applies its own document styling, so the content structure may remain similar even when the visual appearance is not identical.'
                }
            ]
        },
        organize_pdf: {
            name: 'Organize PDF',
            meta_title: 'Organize PDF Pages with Preview Controls | Online PDF Converter',
            meta_keywords: 'remove pages PDF, organize PDF pages, reorder PDF, rotate PDF page, insert blank PDF page',
            meta_description: 'Preview a PDF, drag pages into a new order, rotate pages, remove pages, insert blanks, and export the organized file.',
            desc: 'Rebuild a PDF page by page with visual ordering, rotation, removal, and blank page insertion.',
            seo: [
                {
                    title: 'How to Organize a PDF',
                    content: `<span class="fw-700">View the page thumbnails.</span> Every page appears as a draggable thumbnail, so you are able to see the full document at a glance before making changes. <br><br>
                            <span class="fw-700">Rearrange, rotate, or remove pages:</span><br>
                             - Reorder - drag any thumbnail to a new position in the sequence.<br>
                             - Rotate - turn individual pages 90°, 180°, or 270° to fix sideways or upside-down scans.<br>
                             - Delete - remove pages you don't need, including blank scans or duplicate sheets.<br><br>
                             <span class="fw-700">Insert blank pages:</span> Add new empty pages at any position, useful for filling gaps or keeping spacing consistent.<br><br>
                            `
                }
            ],
            faq: [
                {
                    title: 'Will organizing affect the quality of my PDF?',
                    content: "No. Reordering, rotating, and deleting pages doesn't re-compress or alter the content - text, images, and formatting stay precisely as they were on each page."
                },
                {
                    title: 'Is it possible to rotate just one page instead of the whole document?',
                    content: 'Yes. Rotate each page independently to fix a single sideways scan without affecting the rest of the file.'
                },
                {
                    title: 'Can I undo a page deletion once processing?',
                    content: "Once you've downloaded the reorganized file, deleted pages aren't recoverable from that file - retain your original PDF until you're sure the changes are correct."
                }
            ],
        },
        extract_pages: {
            name: 'Extract Pages',
            meta_title: 'Extract Selected Pages from a PDF | Online PDF Converter',
            meta_keywords: 'selected PDF pages, extract PDF pages, save selected pages, PDF page picker, PDF range export',
            meta_description: 'Pick pages from a PDF preview or type selected page ranges, then save the selected pages as a separate PDF.',
            desc: 'Generate a PDF containing only the pages you select from the preview or selected page range field.',
            modeRange: 'Extract selected page ranges',
            modeRangeDesc: 'Generate a single PDF from page ranges such as 1-3, 7, and 12-15.',
            modeOdd: 'Extract odd pages',
            modeOddDesc: 'Generate a single PDF containing pages 1, 3, 5, and so on.',
            modeEven: 'Extract even pages',
            modeEvenDesc: 'Generate a single PDF containing pages 2, 4, 6, and so on.',
            seo: [
                {
                    title: 'How to Extract Pages from a PDF',
                    content: 'Use the page thumbnails to click individual pages, or type a selected page range (e.g., 4, 7–9, 12) to select multiple pages at once.'
                },
                {
                    title: 'Extract Pages vs. Split PDF',
                    content: `These two tools overlap but serve slightly various needs:<br>
                             <span class="fw-700">Extract Pages</span> is built for picking out a specific set of pages - even non-consecutive ones - and getting them back as a single new PDF.<br>
                             <span class="fw-700"><a href="/split-pdf">Split PDF</a></span> is built for dividing an entire document into multiple separate files, including breaking it into equal chunks or one file per page.
                    `
                }
            ],
            faq: [
                {
                    title: 'Is it possible to extract non-consecutive pages, like pages 2, 5, and 10?',
                    content: "Yes. Select any combination of individual pages and ranges, and the tool will combine them into one output file in their original order."
                },
                {
                    title: 'Do the extracted pages retain their original order?',
                    content: 'Yes. Even if you select pages out of sequence (e.g., clicking page 9 before page 3), the extracted PDF preserves the pages in their source document order.'
                },
                {
                    title: 'Is it possible to extract just one single page?',
                    content: 'Yes. Selecting a single page and processing will give you a one-page PDF containing just that page.'
                }
            ],
        },
        delete_pages: {
            name: 'Delete Pages',
            meta_title: 'Delete Unwanted Pages from a PDF | Online PDF Converter',
            meta_keywords: 'discard PDF pages, delete PDF pages, remove PDF pages, PDF page remover, clean PDF pages',
            meta_description: 'Mark pages to remove from a PDF, review the remaining page set, and save a new file without those pages.',
            desc: 'Remove pages you no longer want and export the rest of the document as a fresh PDF.',
            modeRange: 'Delete selected page ranges',
            modeRangeDesc: 'Delete page ranges such as 1-3, 7, and 12-15.',
            modeOdd: 'Delete odd pages',
            modeOddDesc: 'Delete pages 1, 3, 5, and so on.',
            modeEven: 'Delete even pages',
            modeEvenDesc: 'Delete pages 2, 4, 6, and so on.',
            seo: [
                {
                    title: 'Delete Pages vs. Extract Pages',
                    content: `These two tools take opposite approaches to the same underlying task:<br>
                              <span class="fw-700">Delete Pages</span> keeps everything *except* the pages you select - useful when most of the document should stay and only a few pages need to go.<br>
                              <span class="fw-700"><a href="/extract-pages">Extract Pages</a></span> keeps *only* the pages you select - useful whenever you need just a handful of pages out of a much longer document.<br><br>
                              If you're removing a small number of pages from an otherwise complete document, Delete Pages is usually faster. If you're pulling out a small selection from a large file, Extract Pages is the better fit.`
                }
            ],
            faq: [
                {
                    title: 'Is it possible to delete non-consecutive pages, like pages 3, 8, and 15?',
                    content: 'Yes. Select any combination of individual pages and ranges, and the tool will remove them in a single pass.'
                },
                {
                    title: 'Do the remaining pages retain their original order?',
                    content: 'Yes. Once the chosen pages are removed, the rest of the document keeps its original sequence.'
                },
                {
                    title: 'Is it possible to delete all pages except one?',
                    content: 'Yes, but if you only need a single page, [Extract Pages](/extract-pages) is a more direct way to get the same result.'
                }
            ],
        },
        pdf_multi_tool: {
            name: 'PDF Multi Tool',
            meta_title: 'PDF Multi Tool: Reorder, Rotate, Remove, and Combine Pages | Online PDF Converter',
            meta_keywords: 'duplicate PDF pages, PDF multi tool, reorder PDF pages, rotate PDF pages, remove PDF pages, combine PDF pages',
            meta_description: 'Arrange pages from one or more PDFs, rotate or delete pages, insert blanks, duplicate pages, and export a rebuilt PDF.',
            desc: 'Build a new PDF from chosen pages. Drag pages into order, adjust rotation, remove extras, add blanks, then export.',
            seo: [
                {
                    title: 'Organize PDF Pages in One Workspace',
                    content: 'Make several page-level changes without moving between individual tools. Arrange PDF pages visually, correct their orientation, remove unnecessary material, duplicate useful pages, and prepare a clean document in one workspace.'
                },
                {
                    title: 'Clean Up Scanned or Poorly Assembled Documents',
                    content: 'Correct sideways scans, remove accidental blank or repeated pages, and reposition pages that were captured in the wrong order. A visual thumbnail layout makes it easier to identify page-level problems before generating the revised PDF.'
                },
                {
                    title: 'Add Duplicate or Blank Pages Where Needed',
                    content: 'Duplicate an existing page when the same content is needed elsewhere, or insert blank A4 pages into a chosen position. Blank pages can separate sections, preserve intentional spacing, or provide room for printed notes.'
                }
            ]
        },
        rasterize_pdf: {
            name: 'Rasterize PDF',
            meta_title: 'Rasterize PDF Pages into Images or Image-Based PDF | Online PDF Converter',
            meta_keywords: 'PDF page bitmap, rasterize PDF, flatten PDF to image, PDF DPI render, image-based PDF',
            meta_description: 'Render PDF pages at a chosen DPI and export images or a new image-based PDF.',
            desc: 'Turn vector and text PDF pages into bitmap output with DPI, format, quality, and background controls.',
            seo: [
                {
                    title: 'Rasterize Text and Vector PDF Pages',
                    content: 'Convert each PDF page into bitmap-based output so text, vector graphics, images, and other visible elements are rendered together. This creates a fixed visual representation of the page instead of preserving its original editable or selectable components.'
                }
            ],
            faq: [
                {
                    title: 'What does rasterizing a PDF do?',
                    content: 'Rasterization renders the visible contents of each page into pixels. Text, vector shapes, images, and page graphics become part of one bitmap representation instead of remaining separate PDF objects.'
                },
                {
                    title: 'Will text remain selectable once rasterization?',
                    content: 'No. Text becomes part of the page image and can no longer be selected, searched, or copied as normal PDF text. OCR must be applied afterward when searchable text is still required.'
                }
            ]
        },
        rotate_pdf: {
            name: 'Rotate PDF',
            meta_title: 'Rotate PDF Pages Left, Right, or 180 Degrees | Online PDF Converter',
            meta_keywords: 'PDF orientation, rotate PDF, turn PDF pages, fix PDF rotation, rotate selected pages',
            meta_description: 'Preview PDF pages, rotate all pages or selected pages, reset rotation when necessary, and save the corrected PDF.',
            desc: 'Adjust page orientation with per-page controls or rotate the whole PDF in one action.',
            seo: [
                {
                    title: 'Fix Sideways or Upside-Down PDF Pages',
                    content: 'Correct PDF pages that were scanned, photographed, or saved in the wrong orientation. Rotate the affected pages until text, images, tables, and forms face the proper direction, then generate a corrected copy that is easier to read and share.'
                }
            ],
            faq: [
                {
                    title: 'Can various pages be rotated in various directions?',
                    content: 'Yes. Each page can be adjusted separately, so one page can be turned left while another is turned right or rotated 180 degrees. This helps with PDFs created from several scans with inconsistent orientations.'
                }
            ]
        },
        page_numbers: {
            name: 'Add Page Numbers',
            meta_title: 'Add Page Numbers to a PDF | Online PDF Converter',
            meta_keywords: 'PDF pagination, add page numbers PDF, number PDF pages, PDF page labels, footer page numbers',
            meta_description: 'Place page numbers on a PDF with custom position, format, starting page, starting number, size, and color.',
            desc: 'Add visible numbering to chosen PDF pages and control where the sequence starts and how it looks.',
            position: 'Position',
            positionBottomCenter: 'Bottom center',
            positionBottomLeft: 'Bottom left',
            positionBottomRight: 'Bottom right',
            positionTopCenter: 'Top center',
            positionTopLeft: 'Top left',
            positionTopRight: 'Top right',
            format: 'Format',
            formatPage: 'Page 1',
            formatPageOfTotal: 'Page 1 of 10',
            formatCustom: 'Custom',
            customFormat: 'Custom format',
            startPage: 'Start on page',
            startNumber: 'First number',
            fontSize: 'Font size',
            margin: 'Margin',
            color: 'Color',
            seo: [
                {
                    title: 'Add Page Numbers to a Finished PDF',
                    content: 'Add visible numbering to reports, manuals, proposals, assignments, and other PDFs after the pages are in their final order. Choose where the numbers appear and generate a consistent sequence without returning to the original document editor.'
                },
                {
                    title: 'Adjust the Appearance of PDF Page Numbers',
                    content: 'Choose a numbering format and customize the font size, color, margin, and position to suit the existing page design. These controls help keep numbers readable without covering footers, headings, tables, or other important content.'
                }
            ],
            faq: [
                {
                    title: 'What is the difference between Start on page and First number?',
                    content: 'Start on page identifies the physical PDF page where visible numbering begins. First number controls the value printed on that page. As an example, numbering can begin on the second PDF page while the first visible number is 1.'
                },
                {
                    title: 'How should I select the page number margin?',
                    content: 'The margin controls the distance between the number and the page edge. Increase it when the number appears too close to the edge or might be cut off during printing. Reduce it carefully when the document has limited space around the main content.'
                },
                {
                    title: 'Does adding page numbers create document navigation?',
                    content: 'No. Visible page numbers help readers identify and reference pages, but they do not automatically create bookmarks, internal links, or a table of contents. Those navigation features need to be added separately.'
                }
            ]
        },
        protect_pdf: {
            name: 'Protect PDF',
            meta_title: 'Protect PDF with Passwords and Permissions | Online PDF Converter',
            meta_keywords: 'PDF permissions, protect PDF, password PDF, encrypt PDF, lock PDF',
            meta_description: 'Add an open password, owner password, and permission restrictions to a PDF, then save the protected copy.',
            desc: 'Set PDF access controls, select allowed actions, and export an encrypted file.',
            userPassword: 'User Password',
            confirmUserPassword: 'Confirm User Password',
            ownerPassword: 'Owner Password',
            confirmOwnerPassword: 'Confirm Owner Password',
            permissionsTitle: 'Document Permissions',
            allowPrinting: 'Printing',
            allowCopying: 'Copying',
            allowModifying: 'Modifying',
            allowAnnotating: 'Annotating',
            allowFillingForms: 'Filling forms',
            allowAccessibility: 'Accessibility',
            allowAssembly: 'Page assembly',
            seo: [
                {
                    title: 'Protect a PDF With Password-Based Access',
                    content: 'Add password protection to a PDF before sharing documents that should not be opened freely. The protected copy can require recipients to enter the user password before they can view its contents.'
                },
                {
                    title: 'Use Separate Passwords for Viewing and Control',
                    content: 'The user password controls access to the document, while the owner password provides full control over its permission settings. Keeping these passwords separate allows recipients to visit the PDF without giving them the credentials used to manage its restrictions.'
                },
                {
                    title: 'Select What Recipients Are Allowed to Do',
                    content: 'Configure permissions for actions including printing, copying content, modifying pages, adding annotations, filling forms, using accessibility features, and assembling pages. Select the permissions according to how the document is expected to be reviewed or completed.'
                }
            ],
            faq: [
                {
                    title: 'What is the difference between the user password and the owner password?',
                    content: 'The user password is intended for people who need to visit the PDF under the selected permissions. The owner password provides full access and is used to manage or override those restrictions. Share the user password with recipients and keep the owner password private.'
                },
                {
                    title: 'Do PDF permissions work in every reader?',
                    content: 'Standard PDF readers are expected to follow the permissions stored in the document, but enforcement can vary between applications. Password protection works well for normal access control, but permission settings should not be treated as an absolute way to prevent an authorized viewer from reproducing visible information.'
                },
                {
                    title: 'What happens if I forget the owner password?',
                    content: 'You may be unable to change or remove the permission settings through standard PDF software without the owner password. Store it in a secure password manager and retain an unprotected original in a controlled location when future editing may be required.'
                }
            ]
        },
        unlock_pdf: {
            name: 'Unlock PDF',
            meta_title: 'Unlock PDF Passwords and Restrictions | Online PDF Converter',
            meta_keywords: 'PDF unlocker, unlock PDF, remove PDF password, decrypt PDF, remove PDF restrictions',
            meta_description: 'Enter the known password for a locked PDF, remove supported restrictions, and save an unlocked copy.',
            desc: 'Open a protected PDF with its password and generate a copy without the supported lock settings.',
            password: 'Password',
            seo: [
                {
                    title: 'Remove a Known Password From a PDF',
                    content: 'Generate an unlocked copy of a protected PDF when you have the correct password and permission to modify the file. Once the password requirement is removed, the document can be opened more conveniently in future workflows without entering the same credentials each time.'
                },
                {
                    title: 'Prepare a Protected PDF for Further Processing',
                    content: 'Unlocking a permitted document can make it easier to use with PDF editors, converters, printing tools, or document management workflows. The tool creates a separate unlocked copy, allowing you to preserve the original protected version when it is still needed.'
                }
            ],
            faq: [
                {
                    title: 'Is it possible to unlock a PDF without knowing its opening password?',
                    content: 'No. A PDF that is encrypted with an opening password requires the correct password. This tool removes protection once valid access has been provided; it is not designed to guess, recover, or bypass an unknown password.'
                },
                {
                    title: 'Why did the PDF fail to unlock even with the correct password?',
                    content: 'The file may be damaged or use an encryption method that this tool cannot process. Confirm that the PDF opens successfully with the same password in a standard reader. If it does not, the document may need to be downloaded again or replaced with an undamaged copy.'
                }
            ]
        },
        sign_pdf: {
            name: 'Sign PDF',
            meta_title: 'Add a Visible Signature to PDF | Online PDF Converter',
            meta_keywords: 'signature image PDF, sign PDF, add signature PDF, draw signature, typed signature',
            meta_description: 'Draw, type, or upload a signature, position it on a PDF page, adjust its size, and save the signed file.',
            desc: 'Generate a visible signature and place it exactly on the PDF preview before exporting.',
            seo: [
                {
                    title: 'Add a Signature to a PDF Without Printing',
                    content: 'Sign forms, approval pages, letters, and day-to-day documents directly in the PDF. Create the signature, place it on the required page, and save a signed copy without printing the document and scanning it again.'
                },
                {
                    title: 'Draw, Type, or Upload Your Signature',
                    content: 'Select the signature method that works best for the document. Draw a handwritten signature, type your name to generate a clean text-based mark, or upload an existing signature image when you already have one prepared.'
                },
                {
                    title: 'Generate a Visual Signature for Everyday Documents',
                    content: 'The tool places a visible signature on the PDF page. It does not generate a certificate-based digital signature, verify the signer’s identity, or add cryptographic validation, so it should be used when a visual signature meets the document’s requirements.'
                }
            ],
            faq: [
                {
                    title: 'How can I generate a signature?',
                    content: 'Draw the signature, type signature text, or upload a signature image. Drawing creates a handwritten appearance, typing produces a simple text-based result, and uploading works well when you already have a prepared signature file.'
                },
                {
                    title: 'Is this the same as a certificate-based digital signature?',
                    content: 'No. This tool adds a visible signature to the page. It does not attach a digital certificate, provide cryptographic identity verification, or show whether the PDF was changed after signing.'
                }
            ]
        },
        add_watermark: {
            name: 'Add Watermark',
            meta_title: 'Add Text or Image Watermarks to PDF | Online PDF Converter',
            meta_keywords: 'PDF overlay, PDF watermark, add watermark PDF, text watermark, image watermark',
            meta_description: 'Apply a text or image watermark to chosen PDF pages with placement, opacity, rotation, and repeat settings.',
            desc: 'Place a watermark over PDF pages, tune its position and opacity, and save a watermarked copy.',
            seo: [
                {
                    title: 'Add Text or Image Watermarks to PDFs',
                    content: "Place visible text labels or images on PDF pages, then set the watermark's position, opacity, rotation angle, text size, and color."
                },
                {
                    title: 'Flexible Multi-Page Watermark Settings',
                    content: 'Add one or more watermark styles to specified pages, apply a watermark to every page in one step, or tile a single watermark across the entire page.'
                }
            ],
            faq: [
                {
                    title: 'Is it possible to watermark only certain PDF pages?',
                    content: 'Yes. Choose the relevant pages or enter a custom range such as 1-3, 7, or 12-15. Check the range carefully so covers, appendices, or completed signature pages are not marked unintentionally.'
                },
                {
                    title: 'What does repeating the watermark across the page do?',
                    content: 'The repeat option places several instances of the watermark across each selected page instead of using a single mark. It provides wider coverage, but high opacity or large text can make the document difficult to read.'
                },
                {
                    title: 'Does a watermark stop someone from copying the PDF?',
                    content: 'No. A watermark is a visible label and does not replace password protection or permission controls. It can communicate ownership or document status, but it does not reliably prevent viewing, copying, editing, screenshots, or redistribution.'
                },
                {
                    title: 'Can the watermark be removed?',
                    content: 'Watermarks are not absolutely impossible to remove; the difficulty depends mainly on the type, location, transparency, and degree of integration with the source document. Ordinary, standalone watermark layers are relatively easy to delete, while watermarks that are tiled across the entire page, cover key content, or have been merged with the document content are significantly more difficult to remove and may affect the integrity and clarity of the source content.'
                }
            ]
        },
        crop_pdf: {
            name: 'Crop PDF',
            meta_title: 'Crop PDF Pages by Visual Selection | Online PDF Converter',
            meta_keywords: 'crop selected pages, crop PDF, trim PDF pages, PDF crop box, remove PDF margins',
            meta_description: 'Draw a crop area on the PDF preview, apply it to chosen pages or all pages, and save the trimmed result.',
            desc: 'Trim page edges or unused areas by dragging a crop box over the PDF preview.',
            width: 'Width',
            height: 'Height',
            positionX: 'Position X',
            positionY: 'Position Y',
            custom: 'Custom',
            currentPage: 'Current page',
            currentPageDesc: 'Crop only the page currently shown in the viewer.',
            allPages: 'All pages',
            allPagesDesc: 'Apply this relative crop area to every page.',
            seo: [
                {
                    title: 'Crop Unwanted Areas From PDF Pages',
                    content: 'Remove empty margins, scanner borders, headers, footers, or other unnecessary areas from a PDF page. Draw a crop box around the content you want to keep and generate a cleaner document without manually rebuilding the page.'
                },
                {
                    title: 'Define the Crop Area Visually or by Position',
                    content: 'Adjust the crop box directly in the PDF preview, or use the width, height, and X/Y position settings when more precise placement is needed. This makes it easier to retain the crop consistent and avoid cutting into important text or images.'
                },
                {
                    title: 'Use a Fixed Aspect Ratio When Needed',
                    content: 'Choose a preset ratio such as 16:9, 4:3, 3:4, or 1:1 when the cropped page needs a particular shape. A custom option is available for documents that do not fit a standard proportion.'
                }
            ],
            faq: [
                {
                    title: 'What do Width, Height, Position X, and Position Y control?',
                    content: 'Width and height define the size of the area that will stay visible. Position X moves that area horizontally across the page, while Position Y moves it vertically. These values are useful when dragging the crop box is not precise enough.'
                }
            ]
        },
        form_creator: {
            name: 'Form Creator',
            meta_title: 'Create Fillable Fields in a PDF | Online PDF Converter',
            meta_keywords: 'PDF form builder, PDF form creator, fillable PDF fields, add checkbox PDF, add dropdown PDF',
            meta_description: 'Add text fields, checkboxes, dropdowns, radio buttons, dates, signatures, and buttons to a PDF.',
            desc: 'Turn a static PDF into a fillable form by placing fields on the page preview and editing their properties.',
            seo: [
                {
                    title: 'Turn a Static PDF Into a Fillable Form',
                    content: 'Add interactive fields to an existing PDF so recipients can enter information directly into the document. Place each field on the page preview, adjust its size and position, and build a form without recreating the source page layout.'
                },
                {
                    title: 'Add the Right Field for Each Response',
                    content: 'Add text fields for written answers, checkboxes for independent choices, radio buttons for a single choice, and dropdowns or list boxes for predefined options. Date and signature fields are available when the form needs a date or signing area.'
                },
                {
                    title: 'Position Fields Directly on the PDF Page',
                    content: 'Choose a field, drag it into place, and resize it from the corner handles. Width, height, X position, and Y position can also be adjusted when a field needs to align precisely with printed boxes, lines, or labels already present in the document.'
                }
            ],
            faq: [
                {
                    title: 'What is the best way to turn an existing PDF into a fillable form?',
                    content: 'Visit the PDF in the form creator, choose a field type, and place it over the corresponding area in the page preview. Move or resize the field as needed, edit its properties, and repeat the process for each part of the form.'
                },
                {
                    title: 'What is the best way to add choices to a dropdown or list box?',
                    content: 'Enter the choices in the field properties with one option per line. You may also choose a default so the field displays a predefined value until the recipient changes it.'
                },
                {
                    title: 'What does marking a field as needed do?',
                    content: 'A needed field indicates that the recipient is expected to complete it before the form is considered finished. Use this setting for essential information, but avoid marking optional questions as needed because it can make the form unnecessarily difficult to complete.'
                }
            ]
        },
        edit_pdf: {
            name: 'Edit PDF',
            meta_title: 'Edit PDF with Text, Images, Shapes, and Marks | Online PDF Converter',
            meta_keywords: 'insert image PDF, edit PDF, add text to PDF, annotate PDF, PDF shapes, highlight PDF',
            meta_description: 'Add text, images, signatures, notes, drawings, shapes, highlights, checks, and strikeouts to PDF pages.',
            desc: 'Mark up PDF pages straight on the page preview with editable text, images, drawing tools, shapes, and highlights.',
            seo: [
                {
                    title: 'Add Text, Images, and Annotations to a PDF',
                    content: 'Make practical changes to a PDF by placing new text, images, notes, drawings, shapes, highlights, check marks, or strikeouts straight onto its pages. This works well for completing simple documents, reviewing drafts, marking corrections, and adding information without returning to the original source file.'
                },
                {
                    title: 'Place and Style Each Edit on the Page',
                    content: 'Select an added item to move, resize, restyle, or delete it before generating the edited PDF. Depending on the tool, adjust properties such as text, font size, stroke width, color, fill color, and opacity to keep additions clear against the original page.'
                }
            ],
            faq: [
                {
                    title: 'Is it possible to directly edit text that is already in the PDF?',
                    content: 'No. This tool adds new visible content and annotations but does not rewrite the original text layer. To correct existing wording, edit the source document when available or place a suitable shape over the old text and add replacement text above it.'
                },
                {
                    title: 'What is the best way to add text to a PDF page?',
                    content: 'Select the text tool, click the required position in the page preview, and enter the new text. After placing it, configure the position, dimensions, font size, color, and opacity so it aligns with the surrounding document content.'
                },
                {
                    title: 'Is it possible to place an image on the PDF?',
                    content: 'Yes. Choose an image, select the image tool, and click the page where it should appear. Move and resize it before generating the edited PDF, and ensure it does not cover important page content.'
                },
                {
                    title: 'Can I move or resize an item once adding it?',
                    content: 'Yes. Click an added item to select it, drag it to a new position, or use its corner control to resize it. It is also possible to change available properties or delete the item before generating the edited PDF.'
                }
            ]
        }
    }
};
messages.page.forgotpassVerify = messages.page.forgotpass;



const DOWNLOAD_META_TEMPLATE = {
    meta_title: 'Download Your %toolName% File | Online PDF Converter',
    meta_keywords: 'Online PDF Converter %toolname% download',
    meta_description: 'Save your processed %toolName% file from Online PDF Converter.'
};
const { TOOL_IDS } = require('../../tools');
TOOL_IDS.forEach(tool => {
    const toolPage = messages.page[tool];
    if (!toolPage) {
        return;
    }
    messages.page[tool + '_download'] = {
        meta_title: DOWNLOAD_META_TEMPLATE.meta_title.replace(/%toolName%/g, toolPage.name),
        meta_keywords: DOWNLOAD_META_TEMPLATE.meta_keywords.replace(/%toolName%/g, toolPage.name),
        meta_description: DOWNLOAD_META_TEMPLATE.meta_description.replace(/%toolName%/g, toolPage.name)
    }
});
module.exports = messages;
