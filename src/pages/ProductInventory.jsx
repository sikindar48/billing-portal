import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2, Plus, Search, Package, Edit2, Trash2, ArrowLeft } from 'lucide-react';
import Navigation from '@/components/Navigation';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

const ProductInventory = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Dialog State
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [currentProduct, setCurrentProduct] = useState({ id: null, name: '', description: '', price: '' });

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('user_id', user.id)
        .order('name', { ascending: true });

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      toast.error("Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProduct = async () => {
    if (!currentProduct.name || !currentProduct.price) {
        toast.error("Name and Price are required");
        return;
    }
    
    setIsSaving(true);
    try {
        const { data: { user } } = await supabase.auth.getUser();
        
        const productData = {
            user_id: user.id,
            name: currentProduct.name,
            description: currentProduct.description,
            price: parseFloat(currentProduct.price)
        };

        let error;
        if (currentProduct.id) {
            // Update
            const { error: updateError } = await supabase
                .from('products')
                .update(productData)
                .eq('id', currentProduct.id);
            error = updateError;
        } else {
            // Insert
            const { error: insertError } = await supabase
                .from('products')
                .insert(productData);
            error = insertError;
        }

        if (error) throw error;

        toast.success(currentProduct.id ? "Product updated" : "Product created");
        setIsDialogOpen(false);
        fetchProducts();
    } catch (error) {
        toast.error("Error saving product");
    } finally {
        setIsSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this product?")) return;
    try {
        const { error } = await supabase.from('products').delete().eq('id', id);
        if (error) throw error;
        toast.success("Product deleted");
        setProducts(products.filter(p => p.id !== id));
    } catch (error) {
        toast.error("Failed to delete");
    }
  };

  const openEdit = (product) => {
      setCurrentProduct(product);
      setIsDialogOpen(true);
  };

  const openNew = () => {
      setCurrentProduct({ id: null, name: '', description: '', price: '' });
      setIsDialogOpen(true);
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <Navigation />
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
            <div>
                <Button variant="ghost" onClick={() => navigate('/dashboard')} className="pl-0 hover:bg-transparent mb-2">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
                </Button>
                <h1 className="text-3xl font-bold text-gray-900">Product Inventory</h1>
            </div>
            <Button onClick={openNew} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                <Plus className="mr-2 h-4 w-4" /> Add New Product
            </Button>
        </div>

        {/* Search & List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-4 border-b border-gray-100 bg-gray-50/50">
                <div className="relative max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input 
                        placeholder="Search products..." 
                        className="pl-10 bg-white"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {loading ? (
                <div className="p-8 text-center"><Loader2 className="h-8 w-8 animate-spin mx-auto text-indigo-600" /></div>
            ) : filteredProducts.length === 0 ? (
                <div className="p-12 text-center text-gray-500">
                    <Package className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                    <p>No products found. Add your first one!</p>
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b">
                            <tr>
                                <th className="px-6 py-3">Product Name</th>
                                <th className="px-6 py-3">Description</th>
                                <th className="px-6 py-3 text-right">Price</th>
                                <th className="px-6 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredProducts.map((product) => (
                                <tr key={product.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 font-medium text-gray-900">{product.name}</td>
                                    <td className="px-6 py-4 text-gray-500 truncate max-w-xs">{product.description || '-'}</td>
                                    <td className="px-6 py-4 text-right font-mono">₹{product.price}</td>
                                    <td className="px-6 py-4 text-right">
                                        <Button variant="ghost" size="sm" onClick={() => openEdit(product)}><Edit2 className="h-4 w-4 text-indigo-600" /></Button>
                                        <Button variant="ghost" size="sm" onClick={() => handleDelete(product.id)}><Trash2 className="h-4 w-4 text-red-600" /></Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>{currentProduct.id ? 'Edit Product' : 'Add New Product'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
                <div className="space-y-2">
                    <Label>Product Name</Label>
                    <Input value={currentProduct.name} onChange={e => setCurrentProduct({...currentProduct, name: e.target.value})} placeholder="e.g. Web Design" />
                </div>
                <div className="space-y-2">
                    <Label>Description</Label>
                    <Input value={currentProduct.description} onChange={e => setCurrentProduct({...currentProduct, description: e.target.value})} placeholder="e.g. 5 Pages website" />
                </div>
                <div className="space-y-2">
                    <Label>Price</Label>
                    <Input type="number" value={currentProduct.price} onChange={e => setCurrentProduct({...currentProduct, price: e.target.value})} placeholder="0.00" />
                </div>
            </div>
            <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleSaveProduct} disabled={isSaving} className="bg-indigo-600 text-white">
                    {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save Product'}
                </Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProductInventory;