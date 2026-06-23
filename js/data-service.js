const DataService = {

    ensureSupabase: async () => {
        if (window.supabaseClient) return window.supabaseClient;
        if (!window.supabaseLoadingPromise) {
            window.supabaseLoadingPromise = (async () => {
                if (!window.supabase) {
                    await new Promise((resolve, reject) => {
                        const script = document.createElement('script');
                        script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
                        script.onload = resolve;
                        script.onerror = reject;
                        document.head.appendChild(script);
                    });
                }
                const supabaseUrl = "https://qmfcveywsavujcuoygng.supabase.co";
                const supabaseKey = "sb_publishable_q9tutF2DgPmgKvim8QvxPA_3nQhYRcG";
                window.supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);
                window.supabase = window.supabaseClient; // Keep globally compatible
                return window.supabaseClient;
            })();
        }
        return window.supabaseLoadingPromise;
    },

    generateUUID: () => {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    },

    isUUID: (val) => {
        return val && typeof val === 'string' && val.includes('-');
    },

    login: async (data) => {
        try {
            const client = await DataService.ensureSupabase();
            const { data: users, error } = await client
                .from('users')
                .select('*')
                .eq('user_id', data.userId)
                .eq('password', data.password);
            
            if (error) throw error;
            if (users && users.length > 0) {
                const user = users[0];
                const formattedUser = {
                    id: user.id,
                    userId: user.user_id,
                    fullName: user.full_name,
                    username: user.username,
                    role: user.role,
                    status: user.status,
                    pic: user.pic,
                    companyName: user.company_name,
                    permissions: user.permissions,
                    assignedCategories: user.assigned_categories,
                    charges: user.charges,
                    lastLogin: user.last_login,
                    activeDays: user.active_days,
                    activeDaysList: user.active_days_list
                };
                return { success: true, user: formattedUser };
            }
            return { success: false, message: "Invalid credentials" };
        } catch (err) {
            console.warn("Backend authentication failed, checking local fallback", err);
            
            // Fallback: Check local storage 'admin_users'
            const users = JSON.parse(localStorage.getItem("admin_users")) || [];
            let foundUser = null;

            if (data.role === 'admin') {
                foundUser = users.find(u => {
                    const uId = String(u.userId || u.id || '').trim().toLowerCase();
                    const targetId = String(data.userId || '').trim().toLowerCase();
                    const uRole = String(u.role || '').trim().toLowerCase();
                    return (uId === targetId) && (String(u.password) === String(data.password)) && (uRole === 'admin' || uRole === 'sub-admin');
                });
                if (!foundUser && data.userId === 'admin' && data.password === 'admin123') {
                    foundUser = { role: 'admin', userId: 'admin', username: 'Admin Demo' };
                }
            } else if (data.role === 'company') {
                foundUser = users.find(u => u.username === data.username && u.password === data.password && u.role === 'company');
            } else {
                foundUser = users.find(u => (u.username === data.userId || u.id === data.userId) && u.password === data.password && u.role === 'user');
            }

            if (foundUser) {
                return { success: true, user: foundUser };
            }

            return { success: false, message: "Invalid credentials (Local)" };
        }
    },

    getCategories: async () => {
        try {
            const client = await DataService.ensureSupabase();
            const { data, error } = await client.from('categories').select('*');
            if (error) throw error;
            const categories = data.map(c => ({
                id: c.id,
                name: c.name,
                subCategory: c.sub_category,
                fields: c.fields,
                showOnMainPage: c.show_on_main_page
            }));
            localStorage.setItem("admin_categories", JSON.stringify(categories));
            return categories;
        } catch (err) {
            console.error(err);
            return JSON.parse(localStorage.getItem("admin_categories")) || [];
        }
    },

    getProducts: async () => {
        try {
            const client = await DataService.ensureSupabase();
            const { data, error } = await client.from('products').select('*');
            if (error) throw error;
            const products = data.map(p => ({
                id: p.id,
                category: p.category,
                subCategory: p.sub_category,
                image: p.image,
                status: p.status,
                addedBy: p.added_by,
                createdDate: p.created_date,
                updatedDate: p.updated_date,
                ...(p.extra_fields || {})
            }));
            localStorage.setItem("admin_products", JSON.stringify(products));
            return products;
        } catch (err) {
            console.error(err);
            return JSON.parse(localStorage.getItem("admin_products")) || [];
        }
    },

    getBanners: async () => {
        try {
            const client = await DataService.ensureSupabase();
            const { data, error } = await client.from('banners').select('*');
            if (error) throw error;
            const banners = data.map(b => ({
                id: b.id,
                image: b.image,
                link: b.link,
                status: b.status,
                addedBy: b.added_by,
                createdDate: b.created_date
            }));
            localStorage.setItem("admin_banners", JSON.stringify(banners));
            return banners;
        } catch (err) {
            console.error(err);
            return JSON.parse(localStorage.getItem("admin_banners")) || [];
        }
    },

    getDeals: async () => {
        try {
            const client = await DataService.ensureSupabase();
            const { data, error } = await client.from('deals').select('*');
            if (error) throw error;
            const deals = data.map(d => {
                let desc = d.description || '';
                let cat = d.category || '', sub = d.sub_category || '';
                let productDetail = d.product_detail || '';
                let brand = d.brand || '';
                let contactNo = d.contact_no || '';
                let deliveryNo = d.delivery_no || '';
                let address = d.address || '';
                let areaBlock = d.area_block || '';
                
                let match = desc.match(/<!--META:(.*?)-->/);
                if (match) {
                    try {
                        let meta = JSON.parse(match[1]);
                        if (!cat) cat = meta.c || '';
                        if (!sub) sub = meta.s || '';
                        if (!productDetail) productDetail = meta.pd || '';
                        if (!brand) brand = meta.b || '';
                        if (!contactNo) contactNo = meta.cn || '';
                        if (!deliveryNo) deliveryNo = meta.dn || '';
                        if (!address) address = meta.addr || '';
                        if (!areaBlock) areaBlock = meta.ab || '';
                    } catch(e) {}
                    desc = desc.replace(/<!--META:.*?-->/g, '').trim();
                }
                return {
                id: d.id,
                name: d.name,
                image: d.image,
                desc: desc,
                price: d.price,
                location: d.location,
                whatsapp: d.whatsapp,
                video: d.video,
                status: d.status,
                category: cat,
                subCategory: sub,
                productDetail: productDetail,
                brand: brand,
                contactNo: contactNo,
                deliveryNo: deliveryNo,
                address: address,
                areaBlock: areaBlock,
                addedBy: d.added_by,
                createdDate: d.created_date,
                updatedDate: d.updated_date
                };
            });
            localStorage.setItem("admin_deals", JSON.stringify(deals));
            return deals;
        } catch (err) {
            console.error(err);
            return JSON.parse(localStorage.getItem("admin_deals")) || [];
        }
    },

    getUsers: async () => {
        try {
            const client = await DataService.ensureSupabase();
            const { data, error } = await client.from('users').select('*');
            if (error) throw error;
            const users = data.map(u => ({
                id: u.id,
                userId: u.user_id,
                email: u.email,
                fullName: u.full_name,
                username: u.username,
                password: u.password,
                role: u.role,
                status: u.status,
                pic: u.pic,
                companyName: u.company_name,
                permissions: u.permissions,
                assignedCategories: u.assigned_categories,
                charges: u.charges,
                lastLogin: u.last_login,
                activeDays: u.active_days,
                activeDaysList: u.active_days_list
            }));
            localStorage.setItem("admin_users", JSON.stringify(users));
            return users;
        } catch (err) {
            console.error(err);
            return JSON.parse(localStorage.getItem("admin_users")) || [];
        }
    },

    getBlogs: async () => {
        try {
            const client = await DataService.ensureSupabase();
            const { data, error } = await client.from('blogs').select('*');
            if (error) throw error;
            const blogs = data.map(b => ({
                id: b.id,
                title: b.title,
                content: b.content,
                image: b.image,
                status: b.status,
                addedBy: b.added_by,
                createdDate: b.created_date,
                titleEn: b.title_en || b.title,
                titleUr: b.title_ur || '',
                slug: b.slug || '',
                author: b.author || '',
                categoryEn: b.category_en || '',
                categoryUr: b.category_ur || '',
                descEn: b.desc_en || '',
                descUr: b.desc_ur || '',
                contentEn: b.content_en || b.content,
                contentUr: b.content_ur || '',
                views: b.views || 0,
                date: b.date || ''
            }));
            localStorage.setItem("admin_blogs", JSON.stringify(blogs));
            return blogs;
        } catch (err) {
            console.error(err);
            return JSON.parse(localStorage.getItem("admin_blogs")) || [];
        }
    },

    getTravelPackages: async () => {
        try {
            const client = await DataService.ensureSupabase();
            const { data, error } = await client.from('travel_packages').select('*');
            if (error) throw error;
            const travelPackages = data.map(tp => ({
                id: tp.id,
                title: tp.title,
                image: tp.image,
                desc: tp.description,
                price: tp.price,
                status: tp.status,
                addedBy: tp.added_by,
                createdDate: tp.created_date
            }));
            localStorage.setItem("admin_travel_packages", JSON.stringify(travelPackages));
            return travelPackages;
        } catch (err) {
            console.error(err);
            return JSON.parse(localStorage.getItem("admin_travel_packages")) || [];
        }
    },

    getBroadcasts: async () => {
        try {
            const client = await DataService.ensureSupabase();
            const { data, error } = await client.from('broadcasts').select('*');
            if (error) throw error;
            const broadcasts = data.map(b => ({
                id: b.id,
                message: b.message,
                target: b.target,
                targetUser: b.target_user,
                status: b.status,
                date: b.date,
                addedBy: b.added_by
            }));
            localStorage.setItem("admin_broadcasts", JSON.stringify(broadcasts));
            return broadcasts;
        } catch (err) {
            console.error(err);
            return JSON.parse(localStorage.getItem("admin_broadcasts")) || [];
        }
    },

    getLiveRates: async () => {
        try {
            const client = await DataService.ensureSupabase();
            const { data, error } = await client.from('live_rates').select('*').order('id', { ascending: false }).limit(1);
            if (error) throw error;
            if (data && data.length > 0) {
                const r = data[0];
                const rates = {
                    petrol: r.petrol,
                    petrolOld: r.petrol_old,
                    diesel: r.diesel,
                    dieselOld: r.diesel_old,
                    gold: r.gold,
                    goldOld: r.gold_old,
                    updated: r.updated
                };
                localStorage.setItem("stopbuyLiveRates", JSON.stringify(rates));
                return rates;
            }
            return null;
        } catch (err) {
            console.error("Failed to fetch live rates", err);
            return JSON.parse(localStorage.getItem("stopbuyLiveRates")) || null;
        }
    },

    saveCategories: async (data) => {
        try {
            const client = await DataService.ensureSupabase();
            const { data: dbData } = await client.from('categories').select('id');
            const dbIds = (dbData || []).map(r => r.id);
            
            // Assign UUIDs client-side for new items
            data.forEach(c => {
                if (!DataService.isUUID(c.id)) c.id = DataService.generateUUID();
            });
            const currentIds = data.map(item => item.id);
            
            const toDelete = dbIds.filter(id => !currentIds.includes(id));
            if (toDelete.length > 0) {
                await client.from('categories').delete().in('id', toDelete);
            }
            
            const rows = data.map(c => ({
                id: c.id,
                name: c.name,
                sub_category: c.subCategory || '',
                fields: c.fields || [],
                show_on_main_page: c.showOnMainPage !== false
            }));
            const { error } = await client.from('categories').upsert(rows, { onConflict: 'name' });
            if (error) throw error;
        } catch (err) {
            console.error("Failed to sync categories to Supabase", err);
            alert("Supabase Sync Error: " + err.message);
        }
        localStorage.setItem("admin_categories", JSON.stringify(data));
    },

    saveProducts: async (data) => {
        try {
            const client = await DataService.ensureSupabase();
            const { data: dbData } = await client.from('products').select('id');
            const dbIds = (dbData || []).map(r => r.id);
            
            data.forEach(p => {
                if (!DataService.isUUID(p.id)) p.id = DataService.generateUUID();
            });
            const currentIds = data.map(item => item.id);
            
            const toDelete = dbIds.filter(id => !currentIds.includes(id));
            if (toDelete.length > 0) {
                await client.from('products').delete().in('id', toDelete);
            }
            
            const rows = data.map(p => {
                const baseFields = {
                    id: p.id,
                    category: p.category,
                    sub_category: p.subCategory || '',
                    image: p.image || '',
                    status: p.status || 'Draft',
                    added_by: p.addedBy || '',
                    created_date: p.createdDate || new Date().toISOString(),
                    updated_date: new Date().toISOString()
                };
                const extra_fields = { ...p };
                delete extra_fields.id;
                delete extra_fields.category;
                delete extra_fields.subCategory;
                delete extra_fields.image;
                delete extra_fields.status;
                delete extra_fields.addedBy;
                delete extra_fields.createdDate;
                delete extra_fields.updatedDate;
                baseFields.extra_fields = extra_fields;
                return baseFields;
            });
            const { error } = await client.from('products').upsert(rows);
            if (error) throw error;
        } catch (err) {
            console.error("Failed to sync products to Supabase", err);
            alert("Supabase Sync Error (Products): " + err.message);
        }
        localStorage.setItem("admin_products", JSON.stringify(data));
    },

    saveBanners: async (data) => {
        try {
            const client = await DataService.ensureSupabase();
            const { data: dbData } = await client.from('banners').select('id');
            const dbIds = (dbData || []).map(r => r.id);
            
            data.forEach(b => {
                if (!DataService.isUUID(b.id)) b.id = DataService.generateUUID();
            });
            const currentIds = data.map(item => item.id);
            
            const toDelete = dbIds.filter(id => !currentIds.includes(id));
            if (toDelete.length > 0) {
                await client.from('banners').delete().in('id', toDelete);
            }
            
            const rows = data.map(b => ({
                id: b.id,
                image: b.image,
                link: b.link || '',
                status: b.status || 'Draft',
                added_by: b.addedBy || '',
                created_date: b.createdDate || new Date().toISOString()
            }));
            const { error } = await client.from('banners').upsert(rows);
            if (error) throw error;
        } catch (err) {
            console.error("Failed to sync banners to Supabase", err);
            alert("Supabase Sync Error (Banners): " + err.message);
        }
        localStorage.setItem("admin_banners", JSON.stringify(data));
        return true;
    },

    saveDeals: async (data) => {
        try {
            const client = await DataService.ensureSupabase();
            const { data: dbData } = await client.from('deals').select('id');
            const dbIds = (dbData || []).map(r => r.id);
            
            data.forEach(d => {
                if (!DataService.isUUID(d.id)) d.id = DataService.generateUUID();
            });
            const currentIds = data.map(item => item.id);
            
            const toDelete = dbIds.filter(id => !currentIds.includes(id));
            if (toDelete.length > 0) {
                await client.from('deals').delete().in('id', toDelete);
            }
            
            const rows = data.map(d => {
                let catData = JSON.stringify({
                    c: d.category || '',
                    s: d.subCategory || '',
                    pd: d.productDetail || '',
                    b: d.brand || '',
                    cn: d.contactNo || '',
                    dn: d.deliveryNo || '',
                    addr: d.address || '',
                    ab: d.areaBlock || ''
                });
                let descWithMeta = (d.desc || '') + ' <!--META:' + catData + '-->';
                return {
                id: d.id,
                name: d.name,
                image: d.image || '',
                description: descWithMeta,
                price: d.price || '',
                location: d.location || '',
                whatsapp: d.whatsapp || '',
                video: d.video || '',
                status: d.status || 'Draft',
                added_by: d.addedBy || '',
                created_date: d.createdDate || new Date().toISOString(),
                updated_date: new Date().toISOString(),
                category: d.category || '',
                sub_category: d.subCategory || '',
                product_detail: d.productDetail || '',
                brand: d.brand || '',
                contact_no: d.contactNo || '',
                delivery_no: d.deliveryNo || '',
                address: d.address || '',
                area_block: d.areaBlock || ''
                };
            });
            const { error } = await client.from('deals').upsert(rows);
            if (error) throw error;
        } catch (err) {
            console.error("Failed to sync deals to Supabase", err);
        }
        localStorage.setItem("admin_deals", JSON.stringify(data));
        return true;
    },

    saveUsers: async (data) => {
        try {
            const client = await DataService.ensureSupabase();
            const { data: dbData } = await client.from('users').select('id');
            const dbIds = (dbData || []).map(r => r.id);
            
            data.forEach(u => {
                if (!DataService.isUUID(u.id)) u.id = DataService.generateUUID();
            });
            const currentIds = data.map(item => item.id);
            
            const toDelete = dbIds.filter(id => !currentIds.includes(id));
            if (toDelete.length > 0) {
                await client.from('users').delete().in('id', toDelete);
            }
            
            const rows = data.map(u => ({
                id: u.id,
                user_id: u.userId,
                email: u.email || '',
                full_name: u.fullName || '',
                username: u.username || '',
                password: u.password,
                role: u.role || 'user',
                status: u.status || 'active',
                pic: u.pic || '',
                company_name: u.companyName || '',
                permissions: u.permissions || {},
                assigned_categories: u.assignedCategories || [],
                charges: u.charges || 0,
                last_login: u.lastLogin || null,
                active_days: u.activeDays || 0,
                active_days_list: u.activeDaysList || []
            }));
            const { error } = await client.from('users').upsert(rows, { onConflict: 'user_id' });
            if (error) throw error;
        } catch (err) {
            console.error("Failed to sync users to Supabase", err);
            alert("Supabase Sync Error (Users): " + err.message);
        }
        localStorage.setItem("admin_users", JSON.stringify(data));
        return true;
    },

    saveBlogs: async (data) => {
        try {
            const client = await DataService.ensureSupabase();
            const { data: dbData } = await client.from('blogs').select('id');
            const dbIds = (dbData || []).map(r => r.id);
            
            data.forEach(b => {
                if (!DataService.isUUID(b.id)) b.id = DataService.generateUUID();
            });
            const currentIds = data.map(item => item.id);
            
            const toDelete = dbIds.filter(id => !currentIds.includes(id));
            if (toDelete.length > 0) {
                await client.from('blogs').delete().in('id', toDelete);
            }
            
            const rows = data.map(b => ({
                id: b.id,
                title: b.titleEn || b.title || '',
                content: b.contentEn || b.content || '',
                image: b.image || '',
                status: b.status || 'Draft',
                added_by: b.addedBy || '',
                created_date: b.createdDate || new Date().toISOString(),
                title_en: b.titleEn || '',
                title_ur: b.titleUr || '',
                slug: b.slug || '',
                author: b.author || '',
                category_en: b.categoryEn || '',
                category_ur: b.categoryUr || '',
                desc_en: b.descEn || '',
                desc_ur: b.descUr || '',
                content_en: b.contentEn || '',
                content_ur: b.contentUr || '',
                views: b.views || 0,
                date: b.date || ''
            }));
            const { error } = await client.from('blogs').upsert(rows);
            if (error) throw error;
        } catch (err) {
            console.error("Failed to sync blogs to Supabase", err);
        }
        localStorage.setItem("admin_blogs", JSON.stringify(data));
        return true;
    },

    saveTravelPackages: async (data) => {
        try {
            const client = await DataService.ensureSupabase();
            const { data: dbData } = await client.from('travel_packages').select('id');
            const dbIds = (dbData || []).map(r => r.id);
            
            data.forEach(tp => {
                if (!DataService.isUUID(tp.id)) tp.id = DataService.generateUUID();
            });
            const currentIds = data.map(item => item.id);
            
            const toDelete = dbIds.filter(id => !currentIds.includes(id));
            if (toDelete.length > 0) {
                await client.from('travel_packages').delete().in('id', toDelete);
            }
            
            const rows = data.map(tp => ({
                id: tp.id,
                title: tp.title,
                image: tp.image || '',
                description: tp.desc || '',
                price: tp.price || '',
                status: tp.status || 'Draft',
                added_by: tp.addedBy || '',
                created_date: tp.createdDate || new Date().toISOString()
            }));
            const { error } = await client.from('travel_packages').upsert(rows);
            if (error) throw error;
        } catch (err) {
            console.error("Failed to sync travel packages to Supabase", err);
        }
        localStorage.setItem("admin_travel_packages", JSON.stringify(data));
        return true;
    },

    saveBroadcasts: async (data) => {
        try {
            const client = await DataService.ensureSupabase();
            const { data: dbData } = await client.from('broadcasts').select('id');
            const dbIds = (dbData || []).map(r => r.id);
            
            data.forEach(b => {
                if (!DataService.isUUID(b.id)) b.id = DataService.generateUUID();
            });
            const currentIds = data.map(item => item.id);
            
            const toDelete = dbIds.filter(id => !currentIds.includes(id));
            if (toDelete.length > 0) {
                await client.from('broadcasts').delete().in('id', toDelete);
            }
            
            const rows = data.map(b => ({
                id: b.id,
                message: b.message,
                target: b.target || 'All',
                target_user: b.targetUser || '',
                status: b.status || 'Draft',
                date: b.date || '',
                added_by: b.addedBy || ''
            }));
            const { error } = await client.from('broadcasts').upsert(rows);
            if (error) throw error;
        } catch (err) {
            console.error("Failed to sync broadcasts to Supabase", err);
        }
        localStorage.setItem("admin_broadcasts", JSON.stringify(data));
        return true;
    },

    saveLiveRates: async (data) => {
        try {
            const client = await DataService.ensureSupabase();
            const row = {
                petrol: data.petrol || '',
                petrol_old: data.petrolOld || '',
                diesel: data.diesel || '',
                diesel_old: data.dieselOld || '',
                gold: data.gold || '',
                gold_old: data.goldOld || '',
                updated: data.updated || ''
            };
            const { error } = await client.from('live_rates').insert([row]);
            if (error) throw error;
        } catch (err) {
            console.error("Failed to sync live rates to Supabase", err);
        }
        localStorage.setItem("stopbuyLiveRates", JSON.stringify(data));
        return true;
    }
};