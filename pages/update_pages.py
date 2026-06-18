import os
import re

pages_dir = r"d:\Freelance\Web Designing\Price Comparison\Sample 5\pages"

def read_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        return f.read()

def write_file(filepath, content):
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

# 1. Read categories.html
categories_html = read_file(os.path.join(pages_dir, 'categories.html'))

# Extract standard nav
nav_match = re.search(r'(<nav.*?</nav>)', categories_html, flags=re.DOTALL)
if not nav_match:
    print("Could not find standard nav in categories.html")
    exit(1)
standard_nav = nav_match.group(1)

# Extract standard footer
footer_match = re.search(r'(<!-- FOOTER -->\s*<div class="footer">.*?</div>)', categories_html, flags=re.DOTALL)
if not footer_match:
    print("Could not find standard footer in categories.html")
    exit(1)
standard_footer = footer_match.group(1)

files_to_update = [
    'about.html', 'blogs.html', 'contact.html', 'electronics.html', 
    'fashion.html', 'food.html', 'grocery.html', 'kids.html', 
    'computers.html', 'mobiles.html', 'personal-care.html', 
    'property.html', 'support.html', 'travel.html'
]

for filename in files_to_update:
    filepath = os.path.join(pages_dir, filename)
    if not os.path.exists(filepath):
        print(f"Skipping {filename}, does not exist.")
        continue
        
    content = read_file(filepath)
    
    # Infer title from <title> tag
    title_match = re.search(r'<title>(.*?) - StopBuyPk</title>', content)
    page_name = title_match.group(1).strip() if title_match else filename.replace('.html', '').capitalize()
    if page_name == "All Categories":
        page_name = "Categories"
    
    # Prepare custom nav
    # The standard nav has: <h1>Categories</h1>
    custom_nav = re.sub(r'(<h1[^>]*>)\s*Categories\s*(</h1>)', rf'\g<1>{page_name}\g<2>', standard_nav)
    
    # Replace nav in target file
    # Some files might have <nav>, some might have a different header, but they all should have <nav> as top navigation.
    # Let's check if it has a <nav ...> ... </nav> block
    if re.search(r'<nav.*?</nav>', content, flags=re.DOTALL):
        content = re.sub(r'<nav.*?</nav>', custom_nav, content, flags=re.DOTALL)
    else:
        # if no nav, insert after <body>
        content = re.sub(r'(<body[^>]*>)', rf'\1\n{custom_nav}', content, count=1)
        
    # Replace footer
    # Remove any <footer ...> </footer> tag
    content = re.sub(r'<footer.*?</footer>', '', content, flags=re.DOTALL)
    
    # Remove existing <!-- FOOTER --> ... </div> blocks
    content = re.sub(r'<!-- FOOTER -->\s*<div class="footer">.*?</div>', '', content, flags=re.DOTALL)
    
    # Remove any existing LANG_TOGGLE_SCRIPT blocks
    content = re.sub(r'<!-- LANG_TOGGLE_SCRIPT -->.*?<\/script>', '', content, flags=re.DOTALL)

    lang_toggle_script = """<!-- LANG_TOGGLE_SCRIPT -->
<script>
    const currentLang = localStorage.getItem('qeematLang') || 'en';
    document.documentElement.lang = currentLang;
    document.documentElement.dir = currentLang === 'ur' ? 'rtl' : 'ltr';

    function updateLanguageUI(lang) {
        const toggleText = document.getElementById('lang-toggle-text');
        if (toggleText) toggleText.textContent = lang === 'ur' ? 'English' : 'اردو';
        
        // Custom placeholder toggling if function exists
        if (typeof togglePlaceholders === 'function') {
            togglePlaceholders();
        }
    }

    function toggleLanguage() {
        const newLang = document.documentElement.lang === 'ur' ? 'en' : 'ur';
        document.documentElement.lang = newLang;
        document.documentElement.dir = newLang === 'ur' ? 'rtl' : 'ltr';
        localStorage.setItem('qeematLang', newLang);
        updateLanguageUI(newLang);
    }

    document.addEventListener('DOMContentLoaded', () => {
        updateLanguageUI(currentLang);
    });
</script>"""

    # Insert standard footer and language script right before </body>
    if '</body>' in content:
        content = content.replace('</body>', f'{standard_footer}\n\n{lang_toggle_script}\n</body>')
    else:
        content += f'\n{standard_footer}\n\n{lang_toggle_script}'

    write_file(filepath, content)
    print(f"Updated {filename} with page name: {page_name}")

print("Done.")
