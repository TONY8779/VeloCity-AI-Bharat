import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import {
    GraduationCap, Plus, Video, FileText, Users, BarChart3, DollarSign,
    BookOpen, Play, Lock, Edit3, Trash2, X, Save, Eye, Upload,
    ChevronDown, ChevronRight, Settings, Star
} from 'lucide-react';

export function AcademyView() {
    const { user } = useAuth();
    const { success: showSuccess, error: showError } = useNotification();
    const [activeTab, setActiveTab] = useState('courses');
    const [courses, setCourses] = useState([]);
    const [showCreateCourse, setShowCreateCourse] = useState(false);
    const [newCourse, setNewCourse] = useState({ title: '', description: '', price: '', modules: [{ title: '', lessons: [{ title: '', type: 'video' }] }] });
    const [products, setProducts] = useState([]);
    const [showCreateProduct, setShowCreateProduct] = useState(false);
    const [newProduct, setNewProduct] = useState({ title: '', description: '', price: '', type: 'ebook' });

    const createCourse = () => {
        if (!newCourse.title.trim()) return;
        const course = {
            id: Date.now(),
            ...newCourse,
            students: 0,
            revenue: 0,
            rating: 0,
            status: 'draft',
            createdAt: new Date().toISOString(),
        };
        setCourses(prev => [...prev, course]);
        setNewCourse({ title: '', description: '', price: '', modules: [{ title: '', lessons: [{ title: '', type: 'video' }] }] });
        setShowCreateCourse(false);
        showSuccess('Course created!');
    };

    const addModule = () => {
        setNewCourse(prev => ({
            ...prev,
            modules: [...prev.modules, { title: '', lessons: [{ title: '', type: 'video' }] }],
        }));
    };

    const addLesson = (moduleIndex) => {
        setNewCourse(prev => {
            const modules = [...prev.modules];
            modules[moduleIndex] = { ...modules[moduleIndex], lessons: [...modules[moduleIndex].lessons, { title: '', type: 'video' }] };
            return { ...prev, modules };
        });
    };

    const createProduct = () => {
        if (!newProduct.title.trim()) return;
        const product = {
            id: Date.now(),
            ...newProduct,
            sales: 0,
            revenue: 0,
            createdAt: new Date().toISOString(),
        };
        setProducts(prev => [...prev, product]);
        setNewProduct({ title: '', description: '', price: '', type: 'ebook' });
        setShowCreateProduct(false);
        showSuccess('Product created!');
    };

    const totalStudents = courses.reduce((s, c) => s + c.students, 0);
    const totalRevenue = courses.reduce((s, c) => s + c.revenue, 0) + products.reduce((s, p) => s + p.revenue, 0);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <GraduationCap className="text-amber-400" size={22} /> VeloCity Academy
                    </h2>
                    <p className="text-xs text-zinc-500 mt-1">Build & sell courses and digital products</p>
                </div>
                <div className="flex gap-2">
                    {['courses', 'products', 'students', 'analytics'].map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-4 py-2 rounded-xl text-xs font-semibold capitalize transition-all ${activeTab === tab ? 'bg-white text-black' : 'bg-white/5 text-zinc-400'
                                }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                    { label: 'Courses', value: courses.length, icon: BookOpen, color: 'text-amber-400' },
                    { label: 'Students', value: totalStudents, icon: Users, color: 'text-blue-400' },
                    { label: 'Products', value: products.length, icon: FileText, color: 'text-purple-400' },
                    { label: 'Revenue', value: `₹${totalRevenue.toLocaleString()}`, icon: DollarSign, color: 'text-green-400' },
                ].map((stat, i) => (
                    <div key={i} className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                        <stat.icon size={16} className={stat.color} />
                        <div className="text-lg font-black mt-1">{stat.value}</div>
                        <div className="text-[9px] text-zinc-500">{stat.label}</div>
                    </div>
                ))}
            </div>

            {/* Courses Tab */}
            {activeTab === 'courses' && (
                <div className="space-y-4">
                    <button
                        onClick={() => setShowCreateCourse(true)}
                        className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl text-sm font-bold hover:opacity-90 transition-all"
                    >
                        <Plus size={14} /> Create Course
                    </button>

                    {showCreateCourse && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm overflow-y-auto py-8" onClick={() => setShowCreateCourse(false)}>
                            <div className="bg-[#111] rounded-2xl p-6 w-full max-w-lg mx-4 border border-white/10" onClick={e => e.stopPropagation()}>
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-base font-bold">Create Course</h3>
                                    <button onClick={() => setShowCreateCourse(false)} className="text-zinc-500 hover:text-white"><X size={18} /></button>
                                </div>
                                <div className="space-y-3 max-h-[60vh] overflow-y-auto">
                                    <input value={newCourse.title} onChange={e => setNewCourse(p => ({ ...p, title: e.target.value }))} placeholder="Course title" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:outline-none" />
                                    <textarea value={newCourse.description} onChange={e => setNewCourse(p => ({ ...p, description: e.target.value }))} placeholder="Description" rows={3} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:outline-none resize-none" />
                                    <input value={newCourse.price} onChange={e => setNewCourse(p => ({ ...p, price: e.target.value }))} placeholder="Price (e.g., ₹999)" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:outline-none" />

                                    <div className="border-t border-white/[0.04] pt-3">
                                        <div className="flex items-center justify-between mb-2">
                                            <h4 className="text-xs font-bold text-zinc-400">Modules</h4>
                                            <button onClick={addModule} className="text-[10px] text-amber-400 hover:text-amber-300">+ Add Module</button>
                                        </div>
                                        {newCourse.modules.map((mod, mi) => (
                                            <div key={mi} className="p-3 bg-white/[0.03] rounded-xl mb-2">
                                                <input
                                                    value={mod.title}
                                                    onChange={e => {
                                                        const modules = [...newCourse.modules];
                                                        modules[mi] = { ...modules[mi], title: e.target.value };
                                                        setNewCourse(p => ({ ...p, modules }));
                                                    }}
                                                    placeholder={`Module ${mi + 1} title`}
                                                    className="w-full bg-white/5 rounded-lg px-3 py-2 text-xs text-white placeholder:text-zinc-600 focus:outline-none mb-2"
                                                />
                                                {mod.lessons.map((lesson, li) => (
                                                    <div key={li} className="flex items-center gap-2 mb-1">
                                                        <Play size={10} className="text-zinc-600" />
                                                        <input
                                                            value={lesson.title}
                                                            onChange={e => {
                                                                const modules = [...newCourse.modules];
                                                                modules[mi].lessons[li] = { ...modules[mi].lessons[li], title: e.target.value };
                                                                setNewCourse(p => ({ ...p, modules }));
                                                            }}
                                                            placeholder={`Lesson ${li + 1}`}
                                                            className="flex-1 bg-transparent text-[11px] text-white placeholder:text-zinc-600 focus:outline-none"
                                                        />
                                                    </div>
                                                ))}
                                                <button onClick={() => addLesson(mi)} className="text-[9px] text-zinc-500 hover:text-white mt-1">+ Add Lesson</button>
                                            </div>
                                        ))}
                                    </div>

                                    <button onClick={createCourse} className="w-full py-3 bg-white text-black rounded-xl font-bold text-sm">Create Course</button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Course Grid */}
                    {courses.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {courses.map(course => (
                                <div key={course.id} className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.04] transition-all">
                                    <div className="flex items-center justify-between mb-3">
                                        <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold ${course.status === 'published' ? 'bg-green-500/20 text-green-300' : 'bg-zinc-500/20 text-zinc-300'
                                            }`}>
                                            {course.status}
                                        </span>
                                        <span className="text-sm font-bold text-amber-400">{course.price || 'Free'}</span>
                                    </div>
                                    <h4 className="text-sm font-bold mb-1">{course.title}</h4>
                                    <p className="text-[10px] text-zinc-500 line-clamp-2 mb-3">{course.description}</p>
                                    <div className="flex items-center gap-4 text-[10px] text-zinc-500">
                                        <span className="flex items-center gap-1"><Users size={10} /> {course.students} students</span>
                                        <span className="flex items-center gap-1"><BookOpen size={10} /> {course.modules.length} modules</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12 text-zinc-500">
                            <GraduationCap size={32} className="mx-auto mb-3 opacity-30" />
                            <p className="text-sm">Create your first course to start earning!</p>
                        </div>
                    )}
                </div>
            )}

            {/* Products Tab */}
            {activeTab === 'products' && (
                <div className="space-y-4">
                    <button onClick={() => setShowCreateProduct(true)} className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl text-sm font-bold hover:opacity-90 transition-all">
                        <Plus size={14} /> Create Product
                    </button>

                    {showCreateProduct && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowCreateProduct(false)}>
                            <div className="bg-[#111] rounded-2xl p-6 w-full max-w-md mx-4 border border-white/10" onClick={e => e.stopPropagation()}>
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-base font-bold">Create Digital Product</h3>
                                    <button onClick={() => setShowCreateProduct(false)} className="text-zinc-500 hover:text-white"><X size={18} /></button>
                                </div>
                                <div className="space-y-3">
                                    <input value={newProduct.title} onChange={e => setNewProduct(p => ({ ...p, title: e.target.value }))} placeholder="Product title" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:outline-none" />
                                    <textarea value={newProduct.description} onChange={e => setNewProduct(p => ({ ...p, description: e.target.value }))} placeholder="Description" rows={3} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:outline-none resize-none" />
                                    <select value={newProduct.type} onChange={e => setNewProduct(p => ({ ...p, type: e.target.value }))} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none">
                                        <option value="ebook">📚 Ebook</option>
                                        <option value="template">📋 Template Pack</option>
                                        <option value="preset">🎨 Preset Pack</option>
                                        <option value="guide">📖 Guide</option>
                                    </select>
                                    <input value={newProduct.price} onChange={e => setNewProduct(p => ({ ...p, price: e.target.value }))} placeholder="Price (e.g., ₹199)" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:outline-none" />
                                    <button onClick={createProduct} className="w-full py-3 bg-white text-black rounded-xl font-bold text-sm">Create Product</button>
                                </div>
                            </div>
                        </div>
                    )}

                    {products.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {products.map(product => (
                                <div key={product.id} className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.04]">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="text-lg">{product.type === 'ebook' ? '📚' : product.type === 'template' ? '📋' : product.type === 'preset' ? '🎨' : '📖'}</span>
                                        <h4 className="text-sm font-bold">{product.title}</h4>
                                    </div>
                                    <p className="text-[10px] text-zinc-500 mb-2">{product.description}</p>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-bold text-purple-400">{product.price || 'Free'}</span>
                                        <span className="text-[10px] text-zinc-500">{product.sales} sales</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12 text-zinc-500">
                            <FileText size={32} className="mx-auto mb-3 opacity-30" />
                            <p className="text-sm">Create ebooks, templates, and presets to sell!</p>
                        </div>
                    )}
                </div>
            )}

            {/* Students & Analytics Tabs */}
            {activeTab === 'students' && (
                <div className="text-center py-16 text-zinc-500">
                    <Users size={32} className="mx-auto mb-3 opacity-30" />
                    <p className="text-sm">Student data will appear when you publish courses</p>
                </div>
            )}
            {activeTab === 'analytics' && (
                <div className="text-center py-16 text-zinc-500">
                    <BarChart3 size={32} className="mx-auto mb-3 opacity-30" />
                    <p className="text-sm">Analytics will populate as you make sales</p>
                </div>
            )}
        </div>
    );
}
