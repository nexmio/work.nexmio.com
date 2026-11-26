# Microsoft Store package (MSIX)

Microsoft signs an MSIX package itself when it is published in the Microsoft Store, so there is no certificate to buy and Windows does not show the "unknown publisher" warning. This page is how to build the package, try it, and send it in.

The package is built by `scripts/msix/Build-Msix.ps1` on Windows. The release workflow (`docs/RELEASING.md`) builds it twice for every release: **Nexmio Work Preview** at once and **Nexmio Work** after the owner approves, and keeps each as a workflow artifact. **Nothing is sent to the Store for now:** the release workflows have no step that does it, so the package is uploaded in Partner Center by hand ("Connect the Store" below says how it was connected; the old submit script was removed in 0.30 and is in the git history). The artifacts are (`nexmio-work-preview-msix`, `nexmio-work-stable-msix`). The package is the same build as the installer, with the AI engine inside; there is no separate test copy.

## 1. Reserve the name and read the identity (once)

1. Make a free developer account at https://storedeveloper.microsoft.com (as an individual).
2. In Partner Center choose **Apps and games → New product → MSIX or PWA app** and reserve the name **Nexmio Work** (the name "Nexmio Work" alone is taken). The tile and the Start menu show the short name Nexmio Work.
3. Under **Product management → Product identity** copy three values:
   - **Package/Identity/Name**, for example `12345Nexmio.Work`
   - **Package/Identity/Publisher**, for example `CN=0000-1111-…`
   - **Package/Properties/PublisherDisplayName**
   - the **name you reserved** (`Nexmio Work`): it is the name the package shows in the Start menu and the Store, and Microsoft checks it against the reserved name
4. In the GitHub repository, **Settings → Secrets and variables → Actions → Variables**, add `MSIX_IDENTITY_NAME`, `MSIX_PUBLISHER`, `MSIX_PUBLISHER_DISPLAY_NAME` and `MSIX_DISPLAY_NAME` (the reserved name) with those values. (They are not secrets.) Without them the workflow uses placeholders, which is fine for test packages only.

## Connect the Store (once, so releases reach it by themselves)

1. **Reserve both names** in Partner Center: **Nexmio Work** and **Nexmio Work Preview**. Each is its own product with its own identity.
   - **Preview is private:** under **Pricing and availability → Visibility** choose to hide it from Store search and give it only to people who have its direct link (or make a private audience). Only you know the link, and you can install it from the Store on any Windows computer.
   - **The first package comes from the first Preview release** (the artifact `nexmio-work-preview-msix` of the run). Upload it by hand in a first submission of the Preview product and fill in the listing once. Every later version is uploaded by hand too, for now. Nexmio Work needs no package until you make a version Stable.
2. **Variables per environment** (GitHub → Settings → Environments → `preview` and `stable` → Environment variables). The same three names in both, with the values of that product from the **Product identity** page in Partner Center:
   - `MSIX_IDENTITY_NAME`: **Package/Identity/Name**
   - `MSIX_DISPLAY_NAME`: the name you reserved (`Nexmio Work` in `stable`, `Nexmio Work Preview` in `preview`)
   - `STORE_APP_ID`: the **Store ID** (12 characters, as in the product's address in Partner Center)

   The two values that belong to the developer account are the same for both products: `MSIX_PUBLISHER` (**Package/Identity/Publisher**, the whole `CN=…` text) and `MSIX_PUBLISHER_DISPLAY_NAME` (**Package/Properties/PublisherDisplayName**). Put them once under **Settings → Secrets and variables → Actions → Variables** (repository variables). They are public identifiers, not secrets.

3. Done: nothing more to enter here.
4. **Submission API access:** in Partner Center choose **Account settings → User management → Azure AD applications → Add Azure AD application** (make an app registration in Azure and a client secret first, with the role **Manager**). Then add the three values as **secrets**: `STORE_TENANT_ID`, `STORE_CLIENT_ID`, `STORE_CLIENT_SECRET`.
5. **The Store link on the website:** when Nexmio Work is live, put its address in `site/config.js`. Preview has no link there.

Until step 4 is done, the workflow builds the packages and says "The Microsoft Store is not connected yet" instead of sending them.

## 2. Try the package on a test Windows

The release run keeps only the unsigned package for the Store (`nexmio-work-preview-msix`, `nexmio-work-stable-msix`). To try a package on a test Windows, build a test-signed copy yourself:

On a Windows computer with the Windows SDK, Node, Rust and pnpm:

```powershell
pnpm install
pnpm engine:fetch windows
pnpm tauri build
./scripts/msix/Build-Msix.ps1 -Version 0.31.0 -TestSign -DisplayName "Nexmio Work"
```

This makes the folder `msix-out` with, among other files, `NexmioWork_0.31.0.0_x64.msix` (unsigned, for the Store), `NexmioWork_0.31.0.0_x64_test.msix` (signed with a test certificate) and `nexmio-work-test.cer`.

To try it on a test Windows (a virtual machine or Windows Sandbox, never your everyday or work computer), copy the test `.msix` and the `.cer` over. In PowerShell **as administrator** run `Import-Certificate -FilePath .\nexmio-work-test.cer -CertStoreLocation Cert:\LocalMachine\TrustedPeople`, then `Add-AppxPackage .\NexmioWork_0.31.0.0_x64_test.msix`. Remove it with `Get-AppxPackage *Nexmio* | Remove-AppxPackage`. The certificate makes Windows trust the test copy, which is why it must not be done on a computer you use for real.

If a Build-Msix step fails, `makeappx` says what is wrong with the manifest.

## 3. What to check in the Store version

- Nexmio Work starts, opens a folder as a vault and saves a page (`Ctrl+S`), and the version history works.
- The built-in AI works as in the installer version: the engine is in the package, and Settings → AI downloads only a model into the package's data folder. LM Studio (or another AI on the computer) works too.
- Settings are kept after closing and starting again. Uninstalling (Settings → Apps) removes the app's own data but not your pages.

## 4. Send it in

1. In Partner Center open the app's **Submission**. Upload the **unsigned** `NexmioWork_<version>_x64.msix` from the workflow artifact or from step 2 (not the `_test` file).
2. Fill in the **Store listing**: description, at least one screenshot (the pictures in `docs/screenshots/` can be used; the Store text is in `docs/STORE-LISTING.md`), the icon, and the category (Productivity).
3. **Privacy policy URL**: `https://work.nexmio.com/privacy.html`.
4. **Properties → Age rating** questionnaire, and the **notes for certification**: paste the text from [STORE-LISTING.md](STORE-LISTING.md), "Notes for certification".
5. Under **Pricing and availability** choose **Free**. To keep it out of the public search, choose **Hide this product … available by direct link only** (Markets and visibility).
6. Submit. Certification usually takes some days. Microsoft may ask questions or reject the app: read the message, fix, and send a new package.

## The built-in AI in the Store package

Since 0.30 the AI engine (`llama-server` and its libraries, llama.cpp, MIT licence) is **part of the package**: `scripts/msix/Build-Msix.ps1` copies `src-tauri/engine-bundle/` (filled by `pnpm engine:fetch windows`) to `engine\` next to the program, the same place the installer puts it. Files in a package are signed when the Store takes it in, so the engine can run where a downloaded program was blocked (managed laptops). Only the model is downloaded, into the package's data folder, which goes with the app when it is uninstalled. The Store and GitHub versions are the same build. The package is about 30 MB larger. Known risk: the Store's policy 10.2.2 now concerns only the model file (data, not code).

## Known risks

- **The Store's rules about AI apps** have not been checked either. Nexmio Work lets the user chat with a local model of their own choice; **Help → Report inappropriate AI content…** is the means to report AI content (policy 11.16).
- **WebView2**: Windows 11 has it. On Windows 10 the user may need to install the Edge WebView2 runtime.
- An organisation can still block the Store, or block Store apps that are not approved. Check that the Microsoft Store opens on the computer where you want to use Nexmio Work.
