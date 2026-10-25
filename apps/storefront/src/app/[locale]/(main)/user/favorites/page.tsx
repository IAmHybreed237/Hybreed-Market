import { LoginForm } from '@/components/molecules';
import { Button } from '@/components/atoms';
import { HeartIcon } from '@/icons';
import { retrieveCustomer } from '@/lib/data/customer';
import LocalizedClientLink from '@/components/molecules/LocalizedLink/LocalizedLink';

export default async function FavoritesPage() {
  const user = await retrieveCustomer();

  if (!user) return <LoginForm />;

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-16 h-16 rounded-full bg-action-secondary flex items-center justify-center text-action">
        <HeartIcon size={28} />
      </div>
      <h1 className="heading-md uppercase mt-6">Favorites</h1>
      <p className="text-secondary mt-2 max-w-sm">
        Save products you love and find them here. Your favorites will follow you
        across devices once you are signed in.
      </p>
      <LocalizedClientLink href="/categories" className="mt-6">
        <Button className="px-6 py-3">Browse products</Button>
      </LocalizedClientLink>
    </div>
  );
}
