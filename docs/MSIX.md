# Microsoft Store package (MSIX)

Microsoft signs an MSIX package itself when it is published in the Microsoft Store, so there is no certificate to buy and Windows does not show the "unknown publisher" warning. This page is how to build the package, try it, and send it in.

The package is built by `scripts/msix/Build-Msix.ps1` on Windows. The release workflow (`docs/RELEASING.md`) builds it twice for every release: **Nexmio Work Preview** at once and **Nexmio Work** after the owner approves, and sends each to its Store product with `scripts/store/Submit-Store.ps1`. Both are also kept as workflow artifacts (`nexmio-work-preview-msix`, `nexmio-work-stable-msix`), and a test-signed copy of each (`...-msix-test`).

## 1. Reserve the name and read the identity (once)

1. Make a free developer account at https://storedeveloper.microsoft.com (as an individual).
2. In Partner Center choose **Apps and games → New product → MSIX or PWA app** and reserve the name **Nexmio Work** (the name "Nexmio Work" alone is taken). The tile and the Start menu show the short name Nexmio Work.
3. Under **Product management → Product identity** copy three values:
   - **Package/Identity/Name**, for example `12345Nexmio.Work`
   - **Package/Identity/Publisher**, for example `CN=0000-1111-…`
   - **Package/Properties/PublisherDisplayName**
   - the **name you reserved** (`Nexmio Work`): it is the name the package shows in the Start menu and the Store, and Microsoft checks it against the reserved name
4. In the GitHub repository, **Settings → Secrets and variables → Actions → Variables**, add `MSIX_IDENTITY_NAME`, `MSIX_PUBLISHER`, `MSIX_PUBLISHER_DISPLAY_NAME` and `MSIX_DISPLAY_NAME` (the reserved name) with those values. (They are not secrets.) Without them the workflow uses placeholders, which is fine for test packages only.

5. **Phi Silica (once):** Microsoft unlocks Phi Silica for one package identity with a Limited Access Feature token (requested with the "LAF Access Token Request Form"; feature `com.microsoft.windows.ai.languagemodel`). Under **Settings → Secrets and variables → Actions → Secrets** add `PHI_SILICA_TOKEN` (the token value) and `PHI_SILICA_ATTESTATION` (the whole attestation sentence, ending "…agrees to the terms of use."). `Build-Msix.ps1` writes them to `phi-silica.json` inside the package only; they are not in the program, the repository or the Windows installer. Without them the package works, and Phi Silica shows "no access key". The token stays valid for new versions, because it is tied to the package identity, not the version.

The package depends on the **Windows App SDK runtime** (`Microsoft.WindowsAppRuntime.2`, the version in `Build-Msix.ps1`) and declares the `systemAIModels` capability, both for Phi Silica. The Store installs the runtime with Nexmio Work; the test copy (`nexmio-work-msix-test`) carries it, and `Install-TestMsix.ps1` installs it when Windows does not have it.

## Connect the Store (once, so releases reach it by themselves)

1. **Reserve both names** in Partner Center: **Nexmio Work** and **Nexmio Work Preview**. Each is its own product with its own identity.
   - **Preview is private:** under **Pricing and availability → Visibility** choose to hide it from Store search and give it only to people who have its direct link (or make a private audience). Only you know the link, and you can install it from the Store on any Windows computer.
   - **The first package comes from the first Preview release** (the artifact `nexmio-work-preview-msix` of the run). Upload it by hand in a first submission of the Preview product and fill in the listing once. After that the workflow sends every new version by itself. Nexmio Work needs no package until you make a version Stable.
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

**The easy way:** every release has artifacts called **`nexmio-work-preview-msix-test`** and **`nexmio-work-stable-msix-test`** (GitHub → Actions → the release run → Artifacts). It holds the test-signed package, the test certificate and `Install-TestMsix.ps1`. Unpack it into a folder, then follow "Windows Sandbox" or "A virtual machine" below with that folder as `msix-out`.

**Building it yourself** (not needed if you use the artifact):

On a Windows computer with the Windows SDK, Node, Rust and pnpm:

```powershell
pnpm install
pnpm tauri build
./scripts/msix/Build-Msix.ps1 -Version 0.26.0 -TestSign -DisplayName "Nexmio Work"
```

This makes the folder `msix-out` with, among other files, `NexmioWork_0.26.0.0_x64.msix` (unsigned, for the Store), `NexmioWork_0.26.0.0_x64_test.msix` (signed with a test certificate), `nexmio-work-test.cer` and `Install-TestMsix.ps1`.

**Windows Sandbox** (Windows 11 Pro, feature "Windows Sandbox" turned on): edit `scripts/msix/sandbox.wsb` so that `HostFolder` is the full path of `msix-out`, and double-click it. The sandbox installs Nexmio Work; start it from the Start menu. Everything is gone when you close the sandbox.

**A virtual machine** (or any test computer): copy `msix-out` over, open PowerShell **as administrator** in that folder and run `.\Install-TestMsix.ps1`. Remove it with `.\Install-TestMsix.ps1 -Remove`. Do not do this on your everyday or work computer: the script makes Windows trust the test certificate.

If a Build-Msix step fails, `makeappx` says what is wrong with the manifest.

## 3. What to check in the Store version

- Nexmio Work starts, opens a folder as a vault and saves a page (`Ctrl+S`), and the version history works.
- Foundry Local works as the built-in AI (Settings → AI), and LM Studio works if it is installed. Settings → AI says that the llama.cpp engine is not available in the Store version.
- Settings are kept after closing and starting again. Uninstalling (Settings → Apps) removes the app's own data but not your pages.

## 4. Send it in

1. In Partner Center open the app's **Submission**. Upload the **unsigned** `NexmioWork_<version>_x64.msix` from the workflow artifact or from step 2 (not the `_test` file).
2. Fill in the **Store listing**: description, at least one screenshot (the pictures in `docs/screenshots/` can be used; the Store text is in `docs/STORE-LISTING.md`), the icon, and the category (Productivity).
3. **Privacy policy URL**: `https://work.nexmio.com/privacy.html`.
4. **Properties → Age rating** questionnaire, and the **notes for certification**: say that the source code is public, that it needs no account, that the AI runs on the user's own computer by default (a cloud AI is only used if the user turns it on, after a warning), and how to try it (open any folder as a vault).
5. Under **Pricing and availability** choose **Free**. To keep it out of the public search, choose **Hide this product … available by direct link only** (Markets and visibility).
6. Submit. Certification usually takes some days. Microsoft may ask questions or reject the app: read the message, fix, and send a new package.

## The built-in AI in the Store package

The Store package **does not run the llama.cpp engine** (`engine::catalog::unavailable_reason`): a downloaded program was blocked from starting on a managed laptop, and the Store's policy 10.2.2 is against apps that extend themselves with downloaded code. Settings → AI says so for that engine.

The Store package has **Foundry Local** instead (Microsoft's runtime, MIT-licensed SDK). Its native libraries (`foundry-native\`, about 40 MB, fetched by `scripts/fetch-foundry-native.ps1` and packed by `Build-Msix.ps1`) are inside the package, so they are signed by the Store like the rest. The engine runs in a helper process, which is the same `nexmio-work.exe` started with `--foundry-helper`, so no separate program has to be allowed. Only data is downloaded at the user's request: the hardware parts (execution providers for the NPU or graphics card, from Microsoft) and the model.

Versions 0.8.7 to 0.8.9 also built a second package, `nexmio-work-msix-with-ai`, that could download the llama.cpp engine. It was removed in 0.8.10 because that engine is blocked from starting.

## Known risks

- **Foundry Local in the Store package** is new and untested in a real Store install: Windows 11 version 24H2 or later is needed for it, and the hardware parts and models are downloaded from Microsoft's servers. Policy 10.2.2 (no extending the app with dynamically included code) is the question to watch: only data is downloaded, not programs. LM Studio works if it is installed.
- **The Store's rules about AI apps** have not been checked either. Nexmio Work lets the user chat with a local model of their own choice; **Help → Report inappropriate AI content…** is the means to report AI content (policy 11.16).
- **WebView2**: Windows 11 has it. On Windows 10 the user may need to install the Edge WebView2 runtime.
- An organisation can still block the Store, or block Store apps that are not approved. Check that the Microsoft Store opens on the computer where you want to use Nexmio Work.
