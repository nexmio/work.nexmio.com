# Waiting to be entered in Partner Center

The Store texts are uploaded by hand, so a change in this repository reaches the Store only when someone enters it. This file lists what is waiting. At every release Claude adds what has changed since the last one and tells the owner (see [RELEASING.md](RELEASING.md)). An item is removed when the owner says it is entered. Each item is for **both** products (Nexmio Work Preview and Nexmio Work) unless it says otherwise; tick the one that is done.

The new texts are in the artifact `release-texts` of the release run, and in [STORE-LISTING.md](STORE-LISTING.md).

| What to update in Partner Center                                                      | Where the text is                                       | Preview | Stable |
| ------------------------------------------------------------------------------------- | ------------------------------------------------------- | ------- | ------ |
| Description (requirements first, built-in AI, search by meaning, AI disclosure)       | STORE-LISTING.md, "Description"                         | [ ]     | [ ]    |
| Search terms                                                                          | STORE-LISTING.md, "Search terms"                        | [ ]     | [ ]    |
| System requirements / recommended hardware (remove the NPU and Windows 11 24H2 lines) | store/store-fields.json, `recommendedHardware`          | [ ]     | [ ]    |
| Notes for certification                                                               | STORE-LISTING.md                                        | [ ]     | [ ]    |
| runFullTrust reason                                                                   | STORE-LISTING.md                                        | [ ]     | [ ]    |
| Check the age rating answers (a cloud AI is possible too)                             | STORE-LISTING.md, "Properties and age rating"           | [ ]     | [ ]    |
| Check that live generative AI is marked                                               | STORE-LISTING.md, "Required for apps with AI content"   | [ ]     | [ ]    |
| Check the privacy policy URL (the page itself updates when `site/` is on `main`)      | `https://work.nexmio.com/privacy.html`                  | [ ]     | [ ]    |
| Screenshots, all new in 1.0.0 (ten, in the order in STORE-LISTING.md)                 | `docs/screenshots/`, order in STORE-LISTING.md, "Files" | [ ]     | [ ]    |
| Product features (the Focus view is gone)                                             | store/store-fields.json, `features`                     | [ ]     | [ ]    |
| Description again, 1.0.0 (new tasks, only the AI is beta)                             | STORE-LISTING.md, "Description"                         | [ ]     | [ ]    |
| What's new and the package 1.0.0                                                      | the release run (`release-texts`, the msix download)    | [ ]     | [ ]    |
