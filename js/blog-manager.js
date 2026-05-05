// ================= BLOG MANAGER =================

// Storage Key (Used only as fallback if DataService is missing)
const BLOG_KEY = "qeematBlogs";

let localBlogs = [];

// Get Blogs (Async)
async function getBlogs() {
    if (typeof DataService !== 'undefined') {
        return (await DataService.getBlogs()) || [];
    }
    return JSON.parse(localStorage.getItem(BLOG_KEY)) || [];
}

// Save Blogs (Async)
async function saveBlogs(data) {
    if (typeof DataService !== 'undefined') {
        await DataService.saveBlogs(data);
    } else {
        localStorage.setItem(BLOG_KEY, JSON.stringify(data));
    }
}

// Auto Generate Slug
document.addEventListener("DOMContentLoaded", () => {
    const titleInput = document.getElementById("blogTitleEn");

    if (titleInput) {
        titleInput.addEventListener("input", function () {
            const slug = this.value
                .toLowerCase()
                .trim()
                .replace(/[^a-z0-9 ]/g, "")
                .replace(/\s+/g, "-");

            const slugField = document.getElementById("blogSlug");
            if (slugField) slugField.value = slug;
        });
    }
});

// Handle Form Submit
document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("blogForm");

    if (form) {
        form.addEventListener("submit", async function (e) {
            e.preventDefault();
            
            const btn = document.getElementById("btnSaveBlog");
            if(btn) {
                btn.disabled = true;
                btn.textContent = "Saving...";
            }

            try {
                const editId = form.dataset.editId;

                // Handle old blogs that might have missing fields
                const oldBlog = editId ? localBlogs.find(b => b.id == editId) : null;

                const newBlog = {
                    id: editId ? Number(editId) : Date.now(),
                    titleEn: document.getElementById("blogTitleEn").value,
                    titleUr: document.getElementById("blogTitleUr").value,
                    slug: document.getElementById("blogSlug").value,
                    author: document.getElementById("blogAuthor").value,
                    categoryEn: document.getElementById("blogCategoryDropdown").value,
                    categoryUr: document.getElementById("blogCategoryUr").value,
                    image: document.getElementById("blogImage").value,
                    status: document.getElementById("blogStatus").value,
                    seoTitle: document.getElementById("blogSeoTitle") ? document.getElementById("blogSeoTitle").value : "",
                    metaDesc: document.getElementById("blogMetaDesc") ? document.getElementById("blogMetaDesc").value : "",
                    descEn: document.getElementById("blogDescEn").value,
                    descUr: document.getElementById("blogDescUr").value,
                    contentEn: document.getElementById("blogContentEn").value,
                    contentUr: document.getElementById("blogContentUr").value,
                    views: oldBlog ? (oldBlog.views || 0) : 0,
                    date: oldBlog ? (oldBlog.date || new Date().toLocaleDateString()) : new Date().toLocaleDateString()
                };

                if (editId) {
                    const index = localBlogs.findIndex(b => b.id == editId);
                    if (index !== -1) localBlogs[index] = newBlog;
                } else {
                    localBlogs.unshift(newBlog);
                }

                await saveBlogs(localBlogs);

                alert(editId ? "✅ Blog Updated Successfully!" : "✅ Blog Saved Successfully!");

                cancelBlogEdit(); // Reset form and remove edit state
                renderBlogs();
            } catch(err) {
                console.error("Error saving blog:", err);
                alert("Failed to save blog. Please try again.");
            } finally {
                if(btn) {
                    btn.disabled = false;
                    btn.textContent = form.dataset.editId ? "Update Blog" : "Publish";
                }
            }
        });
    }
});

// Render Blogs
async function renderBlogs() {
    const list = document.getElementById("blogList");
    if (!list) return;

    list.innerHTML = `<p style="color:#aaa; text-align:center;">Loading blogs...</p>`;

    try {
        localBlogs = await getBlogs();
        let blogs = [...localBlogs];
        
        const searchInput = document.getElementById('blogSearchInput');
        const categoryFilter = document.getElementById('blogCategoryFilter');
        
        if (searchInput && searchInput.value) {
            const term = searchInput.value.toLowerCase();
            blogs = blogs.filter(b => 
                (b.titleEn && b.titleEn.toLowerCase().includes(term)) || 
                (b.titleUr && b.titleUr.includes(term)) ||
                (b.author && b.author.toLowerCase().includes(term))
            );
        }
        
        if (categoryFilter && categoryFilter.value !== 'All') {
            blogs = blogs.filter(b => b.categoryEn === categoryFilter.value || b.category === categoryFilter.value);
        }

        list.innerHTML = "";

        if (blogs.length === 0) {
            list.innerHTML = `<p style="color:#aaa; padding-left: 10px;">No blogs found</p>`;
            return;
        }

        blogs.forEach(blog => {
            // Graceful fallback for old local storage data
            const cat = blog.categoryEn || blog.category || '-';
            const stat = blog.status || 'Draft';
            const statColor = stat === 'Publish' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(234, 179, 8, 0.2)';
            const statTextColor = stat === 'Publish' ? '#4ade80' : '#facc15';
            
            // Fix timestamp dates
            let displayDate = blog.date;
            if (displayDate) {
                if (!isNaN(displayDate) && Number(displayDate) > 1000000) {
                    displayDate = new Date(Number(displayDate)).toLocaleDateString();
                } else {
                    const d = new Date(displayDate);
                    if (!isNaN(d.getTime())) {
                        displayDate = d.toLocaleDateString();
                    }
                }
            } else {
                displayDate = '-';
            }

            list.innerHTML += `
            <div class="grid-table-row" style="grid-template-columns: 40px 60px 2fr 1fr 1fr 80px 100px 120px; gap: 15px;">
                <div><input type="checkbox"></div>
                <div><img src="${blog.image}" width="50" style="border-radius: 4px; object-fit: cover; aspect-ratio: 16/9;"></div>
                <div style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${blog.titleEn}</div>
                <div>${cat}</div>
                <div><span style="padding: 2px 8px; border-radius: 12px; font-size: 0.7rem; background: ${statColor}; color: ${statTextColor};">${stat}</span></div>
                <div>${blog.views || 0}</div>
                <div>${displayDate}</div>
                <div style="display: flex; gap: 5px;">
                    <button onclick="editBlog(${blog.id})" class="btn-action edit" style="background: rgba(56, 189, 248, 0.1); color: #38bdf8; border: 1px solid rgba(56, 189, 248, 0.3); padding: 4px 8px; border-radius: 4px; cursor: pointer; transition: all 0.2s;"><i class="fas fa-edit"></i> Edit</button>
                    <button onclick="deleteBlog(${blog.id})" class="btn-action delete" style="background: rgba(239, 68, 68, 0.1); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.3); padding: 4px 8px; border-radius: 4px; cursor: pointer; transition: all 0.2s;"><i class="fas fa-trash"></i></button>
                </div>
            </div>
            `;
        });
    } catch(err) {
        console.error("Error rendering blogs:", err);
        list.innerHTML = `<p style="color:#ef4444; padding-left: 10px;">Failed to load blogs.</p>`;
    }
}

// Edit Blog
window.editBlog = async function(id) {
    const blogs = localBlogs.length > 0 ? localBlogs : await getBlogs();
                localBlogs = blogs;
    const blog = blogs.find(b => String(b.id) === String(id));
    if (!blog) return;

    // Populate form
    document.getElementById("blogTitleEn").value = blog.titleEn || "";
    document.getElementById("blogTitleUr").value = blog.titleUr || "";
    document.getElementById("blogSlug").value = blog.slug || "";
    document.getElementById("blogAuthor").value = blog.author || "";
    document.getElementById("blogCategoryDropdown").value = blog.categoryEn || blog.category || "";
    document.getElementById("blogCategoryUr").value = blog.categoryUr || "";
    document.getElementById("blogImage").value = blog.image || "";
    document.getElementById("blogStatus").value = blog.status || "Publish";
    if (document.getElementById("blogSeoTitle")) document.getElementById("blogSeoTitle").value = blog.seoTitle || "";
    if (document.getElementById("blogMetaDesc")) document.getElementById("blogMetaDesc").value = blog.metaDesc || "";
    document.getElementById("blogDescEn").value = blog.descEn || "";
    document.getElementById("blogDescUr").value = blog.descUr || "";
    document.getElementById("blogContentEn").value = blog.contentEn || "";
    document.getElementById("blogContentUr").value = blog.contentUr || "";

    // Set editing ID and change button
    const form = document.getElementById("blogForm");
    form.dataset.editId = id;
    document.getElementById("btnSaveBlog").textContent = "Update Blog";
    const cancelBtn = document.getElementById("btnCancelBlog");
    if(cancelBtn) cancelBtn.style.display = "inline-block";

    // Scroll to form
    document.getElementById("blogForm").scrollIntoView({ behavior: 'smooth', block: 'center' });
};

window.cancelBlogEdit = function() {
    const form = document.getElementById("blogForm");
    form.reset();
    delete form.dataset.editId;
    document.getElementById("btnSaveBlog").textContent = "Publish";
    const cancelBtn = document.getElementById("btnCancelBlog");
    if(cancelBtn) cancelBtn.style.display = "none";
};

// Delete Blog
window.deleteBlog = async function(id) {
    if(!confirm("Are you sure you want to delete this blog?")) return;
    
    try {
        let blogs = localBlogs.length > 0 ? localBlogs : await getBlogs();
                localBlogs = blogs;
        blogs = blogs.filter(blog => String(blog.id) !== String(id));
        await saveBlogs(blogs);
        renderBlogs();
    } catch(err) {
        console.error("Error deleting blog:", err);
        alert("Failed to delete blog. Please try again.");
    }
}

// Load Blogs on Page Load
document.addEventListener("DOMContentLoaded", renderBlogs);
window.shareAdminBlogToFacebook = function() {
    const title = document.getElementById('blogTitleEn').value || '';
    const desc = document.getElementById('blogDescEn').value || '';
    const textToPost = title ? `${title}\n\n${desc}` : 'Check out our new update!';
    
    // Attempt to copy the text to clipboard
    if (navigator.clipboard) {
        navigator.clipboard.writeText(textToPost).then(() => {
            alert("Blog text copied to clipboard! \n\nYou can now paste it directly into your Facebook Page post.");
            window.open('https://www.facebook.com/profile.php?id=61589302070213', '_blank');
        }).catch(err => {
            console.error('Clipboard copy failed', err);
            window.open('https://www.facebook.com/profile.php?id=61589302070213', '_blank');
        });
    } else {
        // Fallback if clipboard API is not available
        window.open('https://www.facebook.com/profile.php?id=61589302070213', '_blank');
    }
};

