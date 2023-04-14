This GitHub action will add a table containing Crowdin languages translation progress in a .md file

### Usage

1. Add the following lines in your .md file. the progress table will be added between those 2 lines.
```
<!-- CROWDIN-LANGUAGES-PROGRESS-ACTION-START -->
<!-- CROWDIN-LANGUAGES-PROGRESS-ACTION-END -->
```

2. Add a new workflow file `.github/workflows/crowdin-languages-progress.yml`

```yaml
name: Crowdin languages progress action
on:
  push:
    branches: [ main ]
  schedule:
    - cron: "0 */12 * * *"
  workflow_dispatch:

jobs:
  crowdin-languages-progress:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v3

      - name: Generate Crowdin languages progress markdown
        uses: benjaminjonard/crowdin-languages-progress-action@1.0.2
        with:
          languages_per_row: 10
          minimum_completion_percent: 80
          file: README.md
        env:
          CROWDIN_PROJECT_ID: ${{ secrets.CROWDIN_PROJECT_ID }}
          CROWDIN_PERSONAL_TOKEN: ${{ secrets.CROWDIN_PERSONAL_TOKEN }}

      - name: Create Pull Request
        uses: peter-evans/create-pull-request@v4
        with:
          title: New Crowdin languages progress
          body: New Crowdin languages progress by [Crowdin languages progress](https://github.com/benjaminjonard/crowdin-languages-progress-action) GitHub action
          commit-message: New Crowdin languages progress
          branch: crowdin-languages-progress/patch
```

## Variables

| Name                         | Default value | Description                                                                     |
|------------------------------|---------------|---------------------------------------------------------------------------------|
| `languages_per_row`          | 10            | Number of languages displayed on each row                                       |
| `minimum_completion_percent` | 80            | The minimum progress value in % the language must be to be considered available |
| `file`                       | README.md     | The markdown file                                                               |

## Example

![crowdin-languages-progress-screenshot](https://user-images.githubusercontent.com/20560781/232151800-2981a8d6-86ef-4cbc-874b-c604ff3cf8e6.png)


## Licensing
crowdin-languages-progress-action is an Open Source software, released under the MIT License. 

