import { LoginForm } from '@/components/molecules';
import { HeartIcon } from '@/icons';
import { retrieveCustomer } from '@/lib/data/customer';
import { getWishlistProducts } from '@/lib/data/wishlist';
import { MobileProductCard } from '@/components/sections/ProductShelf/MobileProductCard';
import LocalizedClientLink from '@/components/molecules/LocalizedLink/LocalizedLink';

export default async function FavoritesPage() {
  const user = await retrieveCustomer();

  if (!user) return <LoginForm />;

  const products = await getWishlistProducts();

  if (!products.length) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
        <div className="w-16 h-16 rounded-full bg-action-secondary flex items-center justify-center text-action">
          <HeartIcon size={28} />
        </div>
        <h1 className="heading-md uppercase mt-6">Favorites</h1>
        <p className="text-secondary mt-2 max-w-sm">
          Save products you love and find them here. Tap the heart on any product
          to add it to your favorites.
        </p>
        <LocalizedClientLink href="/categories" className="mt-6">
          <span className="inline-block px-6 py-3 rounded-full bg-[#2563EB] text-white text-sm font-semibold">
            Browse products
          </span>
        </LocalizedClientLink>
      </div>
    );
  }

  return (
    <div className="px-3 pb-8">
      <h1 className="text-[20px] font-bold text-[#1F1F23] pt-4 pb-3">
        Favorites · {products.length}
      </h1>
      <div className="grid grid-cols-2 gap-3">
        {products.map((p: any) => (
          <MobileProductCard key={p.id} p={p} />
        ))}
      </div>
    </div>
  );
}
