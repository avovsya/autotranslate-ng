# Installation

```
npm install -g autotranslate-ng
```

# Introduction
This application automatically replaces text in HTML tags to [angular-translate](https://angular-translate.github.io/) attributes, and creates translation table.

## Example

Source HTML: 
```
<h2>Top {{ array.length }} of {{some.count}} users for Today</h2>
<a href="/next">Next</a>
```

Result HTML: 
```
<h2 translate="top_of_users_for_today" translate-values="REPLACE_45 {{ array.length }}::{{some.count}}"></h2>
<a href="/next" translate="next"></a>

```

Translation table(JSON):
```
{
  "top_of_users_for_today": "REPLACE_45 Top {{ array.length }} of {{ some.count }} users for Today",
  "next": "Next",
}
```

From above example you can also notice that **autotranslate-ng** also introduces `translate-values` attributes for angular bindings if they exists in a tag's text.
Unfortunately you need to manually convert bindings, automatic conversion is not supported.

# Usage

```
$ autotranslate-ng [path_to_file.html]
```

Result will be placed into current folder as:
1. `filename_translation.html` - original HTML file with text replaced to angular-translate attributes
2. `filename_translation.json` - translation table in JSON format

# Enjoy
