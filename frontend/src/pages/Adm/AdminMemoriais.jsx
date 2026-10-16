import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Search, MapPin, X, QrCode, ChevronLeft, ChevronRight } from 'lucide-react';
import QRCode from 'react-qr-code';
import {
    fetchMemoriais,
    createMemorial,
    updateMemorial as apiUpdateMemorial,
    deleteMemorial as apiDeleteMemorial,
    resolveImageUrl,
} from '../../lib/api';
import AdminSidebar from './AdminSidebar';
import styles from './AdminQuadrasLotes.module.css';

const ITEMS_PER_PAGE = 10;

const EMPTY_FORM = {
    nome: '', dataNascimento: '', dataMorte: '',
    setor: '', lote: '',
    descricao: '', biografia: '', imagem: '', tipo: 'historica'
};

const getToken = () => localStorage.getItem('memorialAdminToken') || '';

// Só resolve a URL se ainda não for absoluta, para não prefixar o domínio duas vezes
const isAbsoluteUrl = (src) => /^(https?:)?\/\//i.test(src) || src.startsWith('data:');
const resolveOnce = (src) => (!src || isAbsoluteUrl(src) ? src : resolveImageUrl(src));

export default function AdminMemoriais() {
    const [memoriais, setMemoriais] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);

    const [selectedImageFile, setSelectedImageFile] = useState(null);
    const [selectedGalleryFiles, setSelectedGalleryFiles] = useState([]);

    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [isQrModalOpen, setIsQrModalOpen] = useState(false);
    const [selectedMemorial, setSelectedMemorial] = useState(null);

    const [formData, setFormData] = useState(EMPTY_FORM);

    // Modal de confirmação genérico
    const [confirmModal, setConfirmModal] = useState({ open: false, title: '', message: '', onConfirm: null });

    const openConfirm = (title, message, onConfirm) =>
        setConfirmModal({ open: true, title, message, onConfirm });
    const closeConfirm = () =>
        setConfirmModal({ open: false, title: '', message: '', onConfirm: null });

    // --- NORMALIZAÇÃO DOS DADOS DA API ---
    const normalizeMemorialsFromApi = (items) => items.map((item) => ({
        ...item,
        localizacao: item.localizacao || '',
        tipo: item.tipo || 'historica',
        imagem: resolveOnce(item.imagem || item.galeria?.[0]) || 'https://placehold.co/400x400/png',
        galeria: Array.isArray(item.galeria) ? item.galeria.filter(Boolean).map((src) => resolveOnce(src)) : [],
        descricao: item.descricao || item.biografia || '',
        dataNascimento: item.dataNascimento || '',
        dataMorte: item.dataMorte || '',
    }));

    // --- CARREGAR DO BANCO ---
    useEffect(() => {
        async function loadMemoriais() {
            try {
                const data = await fetchMemoriais();
                setMemoriais(normalizeMemorialsFromApi(data));
            } catch (error) {
                console.error('Erro ao buscar memoriais:', error);
                setMemoriais([]);
            } finally {
                setIsLoading(false);
            }
        }

        loadMemoriais();
    }, []);

    // --- FILTRAGEM ---
    const filteredMemoriais = memoriais.filter(memorial =>
        typeof memorial.nome === 'string' &&
        memorial.nome.toLowerCase().includes(searchTerm.toLowerCase())
    );

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm]);

    // --- PAGINAÇÃO ---
    const totalPages = Math.max(1, Math.ceil(filteredMemoriais.length / ITEMS_PER_PAGE));
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const currentMemoriais = filteredMemoriais.slice(startIndex, startIndex + ITEMS_PER_PAGE);

    // --- SALVAR ---
    const saveMemorial = async (e) => {
        e.preventDefault();
        const token = getToken();
        const setor = (formData.setor || '').trim();
        const lote = (formData.lote || '').trim();
        const localizacao = `Quadra ${setor}, Lote ${lote}`;
        const imagemAlterada = !!formData.imagem?.trim() && formData.imagem !== selectedMemorial?.imagem;

        try {
            const form = new FormData();
            form.append('nome', formData.nome);
            form.append('biografia', formData.biografia || '');
            form.append('descricao', formData.descricao || '');
            form.append('dataNascimento', formData.dataNascimento || '');
            form.append('dataMorte', formData.dataMorte || '');
            form.append('localizacao', localizacao);
            form.append('tipo', formData.tipo || 'historica');

            if (selectedImageFile) {
                form.append('imagem', selectedImageFile);
            } else if (imagemAlterada) {
                form.append('imagem', formData.imagem.trim());
            }

            selectedGalleryFiles.forEach((file) => form.append('galeria', file));

            const payload = selectedImageFile || selectedGalleryFiles.length > 0
                ? form
                : {
                    nome: formData.nome,
                    biografia: formData.biografia || '',
                    descricao: formData.descricao || '',
                    dataNascimento: formData.dataNascimento || '',
                    dataMorte: formData.dataMorte || '',
                    localizacao,
                    tipo: formData.tipo || 'historica',
                    ...(imagemAlterada ? { imagem: formData.imagem.trim() } : {}),
                };

            if (selectedMemorial) {
                const updated = await apiUpdateMemorial(selectedMemorial.id, payload, token);
                setMemoriais((current) => normalizeMemorialsFromApi(
                    current.map((item) => item.id === selectedMemorial.id ? { ...item, ...updated, localizacao } : item)
                ));
            } else {
                const created = await createMemorial(payload, token);
                setMemoriais((current) => normalizeMemorialsFromApi([{ ...created, localizacao }, ...current]));
            }

            closeFormModal();
        } catch (error) {
            window.alert(error.message || 'Não foi possível salvar o memorial.');
        }
    };

    // --- EXCLUIR ---
    const deleteMemorial = (id, nome) => {
        openConfirm(
            'Excluir memorial',
            `Tem certeza que deseja excluir o memorial de ${nome}? Esta ação não pode ser desfeita.`,
            async () => {
                try {
                    await apiDeleteMemorial(id, getToken());
                    setMemoriais((current) => current.filter((item) => item.id !== id));

                    if (currentMemoriais.length === 1 && currentPage > 1) {
                        setCurrentPage((p) => p - 1);
                    }
                } catch (error) {
                    window.alert(error.message || 'Não foi possível excluir o memorial.');
                }
            }
        );
    };

    // --- FORMATAÇÃO / INPUTS ---
    const formatarData = (valor) => {
        const n = valor.replace(/\D/g, '').slice(0, 8);
        if (n.length <= 2) return n;
        if (n.length <= 4) return `${n.slice(0, 2)}/${n.slice(2)}`;
        return `${n.slice(0, 2)}/${n.slice(2, 4)}/${n.slice(4)}`;
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        let v = value;
        if (name === 'dataNascimento' || name === 'dataMorte') v = formatarData(value);
        else if (name === 'setor') v = value.toUpperCase();
        setFormData(prev => ({ ...prev, [name]: v }));
    };

    const handleImageUpload = (e) => {
        const file = e.target.files?.[0];
        if (!file) {
            setSelectedImageFile(null);
            return;
        }

        setSelectedImageFile(file);
        const reader = new FileReader();
        reader.onloadend = () => {
            setFormData(prev => ({ ...prev, imagem: reader.result }));
        };
        reader.readAsDataURL(file);
    };

    const handleGalleryUpload = (e) => {
        setSelectedGalleryFiles(Array.from(e.target.files || []));
    };

    // --- CONTROLES DE MODAL ---
    const openNewModal = () => {
        setSelectedMemorial(null);
        setFormData(EMPTY_FORM);
        setIsFormModalOpen(true);
    };

    const openEditModal = (memorial) => {
        setSelectedMemorial(memorial);
        let setor = '', lote = '';
        if (memorial.localizacao) {
            const s = memorial.localizacao.match(/Quadra\s+(.+?),/);
            const l = memorial.localizacao.match(/Lote\s+(.+?)$/);
            if (s) setor = s[1].trim();
            if (l) lote = l[1].trim();
        }
        setFormData({ ...memorial, setor, lote });
        setIsFormModalOpen(true);
    };

    const closeFormModal = () => {
        setSelectedMemorial(null);
        setSelectedImageFile(null);
        setSelectedGalleryFiles([]);
        setFormData(EMPTY_FORM);
        setIsFormModalOpen(false);
    };

    const openQrModal = (memorial) => {
        setSelectedMemorial(memorial);
        setIsQrModalOpen(true);
    };

    const qrCodeUrl = selectedMemorial ? `${window.location.origin}/memoriais/${selectedMemorial.id}` : '';

    return (
        <div className={styles.adminLayout}>
            <AdminSidebar />

            <main className={styles.mainContent}>
                <div className={styles.container}>
                    <header className={styles.header}>
                        <div>
                            <h1 className={styles.title}>Memoriais</h1>
                            <p className={styles.subtitle}>Gerencie registros, biografias e gere QR Codes.</p>
                        </div>
                        <button className={styles.addButton} onClick={openNewModal}>
                            <Plus size={20} />
                            Novo Memorial
                        </button>
                    </header>

                    <div className={styles.card}>
                        <div className={styles.toolbar}>
                            <div className={styles.searchBox}>
                                <Search size={18} className={styles.searchIcon} />
                                <input
                                    type="text"
                                    placeholder="Buscar memorial..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className={styles.tableContainer}>
                            <table className={styles.table}>
                                <thead>
                                    <tr>
                                        <th>Nome do Falecido</th>
                                        <th>Localização</th>
                                        <th>Tipo</th>
                                        <th className={styles.actionsColumn}>Ações</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {isLoading ? (
                                        <tr>
                                            <td colSpan="4" className={styles.emptyState}>Carregando memoriais...</td>
                                        </tr>
                                    ) : (
                                        <>
                                            {currentMemoriais.map(memorial => (
                                                <tr key={memorial.id}>
                                                    <td className={styles.nameCell}>
                                                        <div className={styles.avatar}>
                                                            <img src={memorial.imagem} alt={memorial.nome} />
                                                        </div>
                                                        <div>
                                                            <span className={styles.name}>{memorial.nome}</span>
                                                            <span className={styles.dateCell}>
                                                                {memorial.dataNascimento || '—'} — {memorial.dataMorte || '—'}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className={styles.locationCell}>
                                                        <span className={styles.locationContent}>
                                                            <MapPin size={16} className={styles.pinIcon} />
                                                            {memorial.localizacao || '—'}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <span className={`${styles.badge} ${memorial.tipo === 'historica' ? styles.badgeHist : styles.badgeRec}`}>
                                                            {memorial.tipo === 'historica' ? 'Histórico' : 'Recente'}
                                                        </span>
                                                    </td>
                                                    <td className={styles.actionsCell}>
                                                        <button className={styles.iconBtn} title="Gerar QR Code" onClick={() => openQrModal(memorial)}>
                                                            <QrCode size={18} />
                                                        </button>
                                                        <button className={styles.iconBtn} title="Editar" onClick={() => openEditModal(memorial)}>
                                                            <Edit size={18} />
                                                        </button>
                                                        <button className={`${styles.iconBtn} ${styles.deleteBtn}`} title="Excluir" onClick={() => deleteMemorial(memorial.id, memorial.nome)}>
                                                            <Trash2 size={18} />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                            {currentMemoriais.length === 0 && (
                                                <tr>
                                                    <td colSpan="4" className={styles.emptyState}>Nenhum memorial encontrado.</td>
                                                </tr>
                                            )}
                                        </>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* --- PAGINAÇÃO --- */}
                        {!isLoading && totalPages > 1 && (
                            <div className={styles.paginationContainer}>
                                <p className={styles.paginationInfo}>
                                    Mostrando {startIndex + 1} a {Math.min(startIndex + ITEMS_PER_PAGE, filteredMemoriais.length)} de {filteredMemoriais.length} registros
                                </p>
                                <div className={styles.pagination}>
                                    <button
                                        className={styles.pageBtn}
                                        disabled={currentPage === 1}
                                        onClick={() => setCurrentPage(prev => prev - 1)}
                                    >
                                        <ChevronLeft size={18} />
                                    </button>

                                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                                        <button
                                            key={page}
                                            className={`${styles.pageBtn} ${page === currentPage ? styles.pageBtnActive : ''}`}
                                            onClick={() => setCurrentPage(page)}
                                        >
                                            {page}
                                        </button>
                                    ))}

                                    <button
                                        className={styles.pageBtn}
                                        disabled={currentPage === totalPages}
                                        onClick={() => setCurrentPage(prev => prev + 1)}
                                    >
                                        <ChevronRight size={18} />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </main>

            {/* --- MODAL DE FORMULÁRIO (Criar/Editar) --- */}
            {isFormModalOpen && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modalContentLarge}>
                        <div className={styles.modalHeader}>
                            <h2>{selectedMemorial ? 'Editar Memorial' : 'Novo Memorial'}</h2>
                            <button className={styles.closeBtn} onClick={closeFormModal}><X size={24} /></button>
                        </div>

                        <div className={styles.modalBody}>
                            <form onSubmit={saveMemorial} className={styles.formGrid}>
                                <div className={styles.formCol}>
                                    <h3>Dados Pessoais e Localização</h3>
                                    <div className={styles.formGroup}>
                                        <label>Nome Completo *</label>
                                        <input type="text" name="nome" required value={formData.nome} onChange={handleInputChange} />
                                    </div>
                                    <div className={styles.formRow}>
                                        <div className={styles.formGroup}>
                                            <label>Data Nascimento *</label>
                                            <input type="text" name="dataNascimento" required placeholder="Ex: 12/03/1823" value={formData.dataNascimento} onChange={handleInputChange} />
                                        </div>
                                        <div className={styles.formGroup}>
                                            <label>Data de Falecimento *</label>
                                            <input type="text" name="dataMorte" required placeholder="Ex: 04/11/1912" value={formData.dataMorte} onChange={handleInputChange} />
                                        </div>
                                    </div>
                                    <div className={styles.formRow}>
                                        <div className={styles.formGroup}>
                                            <label>Quadra *</label>
                                            <input type="text" name="setor" required value={formData.setor} onChange={handleInputChange} />
                                        </div>
                                        <div className={styles.formGroup}>
                                            <label>Lote *</label>
                                            <input type="text" name="lote" required value={formData.lote} onChange={handleInputChange} />
                                        </div>
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label>Categoria (Tipo) *</label>
                                        <select name="tipo" value={formData.tipo} onChange={handleInputChange}>
                                            <option value="historica">Personalidade Histórica</option>
                                            <option value="recente">Memorial Recente</option>
                                        </select>
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label>Imagem de Perfil</label>
                                        <input type="file" accept="image/*" onChange={handleImageUpload} />
                                        <small style={{ display: 'block', marginTop: '8px', color: '#666' }}>
                                            Você pode escolher uma foto do computador ou usar um URL abaixo.
                                        </small>
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label>URL da Imagem (opcional)</label>
                                        <input type="url" name="imagem" placeholder="https://..." value={formData.imagem} onChange={handleInputChange} />
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label>Fotos da Galeria (opcional)</label>
                                        <input type="file" accept="image/*" multiple onChange={handleGalleryUpload} />
                                        <small style={{ display: 'block', marginTop: '8px', color: '#666' }}>
                                            Você pode enviar até 10 imagens para a galeria do memorial.
                                        </small>
                                    </div>
                                </div>

                                <div className={styles.formCol}>
                                    <h3>Biografia e Textos</h3>
                                    <div className={styles.formGroup}>
                                        <label>Breve Descrição *</label>
                                        <textarea name="descricao" rows="2" required value={formData.descricao} onChange={handleInputChange} />
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label>Biografia Completa {formData.tipo === 'historica' ? '*' : '(Opcional)'}</label>
                                        <textarea name="biografia" rows="6" required={formData.tipo === 'historica'} value={formData.biografia} onChange={handleInputChange} />
                                    </div>
                                </div>

                                <div className={styles.modalActionsFull}>
                                    <button type="button" className={styles.cancelBtn} onClick={closeFormModal}>Cancelar</button>
                                    <button type="submit" className={styles.saveBtn}>Salvar</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* --- MODAL DE CONFIRMAÇÃO --- */}
            {confirmModal.open && (
                <div className={styles.modalOverlay} onClick={closeConfirm}>
                    <div className={styles.confirmModal} onClick={(e) => e.stopPropagation()}>
                        <div className={styles.confirmIcon}>
                            <Trash2 size={28} color="#cc2200" />
                        </div>
                        <h2 className={styles.confirmTitle}>{confirmModal.title}</h2>
                        <p className={styles.confirmMessage}>{confirmModal.message}</p>
                        <div className={styles.confirmActions}>
                            <button className={styles.cancelBtn} onClick={closeConfirm}>Cancelar</button>
                            <button
                                className={styles.deleteConfirmBtn}
                                onClick={() => { confirmModal.onConfirm?.(); closeConfirm(); }}
                            >
                                Excluir
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* --- MODAL DO QR CODE --- */}
            {isQrModalOpen && selectedMemorial && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modalContentSmall}>
                        <div className={styles.qrHeader}>
                            <h2>QR Code do Memorial</h2>
                            <button className={styles.closeBtn} onClick={() => setIsQrModalOpen(false)}><X size={24} /></button>
                        </div>
                        <div className={styles.qrContainer}>
                            <p>Escaneie para acessar o memorial de <strong>{selectedMemorial.nome}</strong></p>
                            <div className={styles.qrCodeBox}>
                                <QRCode value={qrCodeUrl} size={200} fgColor="#003366" />
                            </div>
                            <button className={styles.saveBtn} onClick={() => window.print()}>
                                Imprimir Placa
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}