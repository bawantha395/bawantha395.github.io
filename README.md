# Bawantha Rathnayake Portfolio

Static GitHub Pages portfolio for Bawantha Rathnayake, a Cloud and DevOps Engineer.

## Focus

The portfolio presents practical experience across:

- AWS infrastructure and Amazon EKS
- Terraform-based environment provisioning
- GitHub Actions and Argo CD GitOps delivery
- MLOps workflows for demand forecasting and image matching
- LLMOps workflows using document extraction and Bedrock
- Kubernetes observability, security and application delivery

The lead case study is **Stocklane**, a workshop stock-management platform that combines AWS solution architecture, GitOps, MLOps and LLMOps. The original AWS EKS GitOps microservices platform remains available as a separate cloud engineering case study.

## Structure

- `index.html` contains the portfolio content and accessible page structure.
- `styles.css` contains the responsive visual system and print styles.
- `script.js` provides navigation, filtering, dialogs and progressive enhancement.
- `slideshows.js` provides accessible project evidence carousels.
- `assets/` contains project diagrams, screenshots, PDFs, fonts and technology icons.

The site has no build step or runtime dependencies and can be deployed directly as a static GitHub Pages site.

## Visual experience

The landing view uses a bright, transparent glassmorphism workspace designed to explain the portfolio to both technical and non-technical visitors. The MacBook-style hero is a conceptual local cloud lab: the terminal and technology icons illustrate the relationship between a laptop, Kubernetes, GitOps and observability without claiming live cluster telemetry.

Technical depth is progressively disclosed through the existing Projects, Cloud Lab, Skills and experience sections. Decorative motion respects reduced-motion preferences, and the Argo CD pointer companion is enabled only for desktop fine-pointer devices.