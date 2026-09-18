import sys, re
with open('d:/Freelance/Web Designing/Price Comparison/Sample 5/pages/grocery.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Let's find all <div class='section-box' or '<div id=' that look like major sections
sections = re.finditer(r'(<div[^>]*class=\"section-box[^\"]*\"[^>]*>|<section[^>]*>|<div id=\"search-results\"[^>]*>)', content)
for match in sections:
    start = match.start()
    snippet = content[start:start+400]
    title_match = re.search(r'<span class=\"lang-en\">(.*?)</span>', snippet)
    title = title_match.group(1) if title_match else 'No title found'
    print(f'Section at {start}: {title}')
