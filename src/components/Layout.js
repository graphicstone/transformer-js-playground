import { Link as RouterLink } from 'react-router-dom';
import { Home } from 'lucide-react';
import { Button } from './ui/button';

function Layout({ children }) {
	return (
		<div className="min-h-screen">
			{/* Navigation */}
			<nav className="border-b bg-white/75 backdrop-blur-sm sticky top-0 z-50">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="flex items-center justify-between h-16">
						<Button
							variant="ghost"
							size="lg"
							asChild
							className="font-semibold text-gray-900 hover:text-gray-900"
						>
							<RouterLink to="/" className="flex items-center gap-2">
								<Home className="w-5 h-5" />
								Transformer.js Playground
							</RouterLink>
						</Button>
					</div>
				</div>
			</nav>

			{/* Main Content */}
			<main>{children}</main>
		</div>
	);
}

export default Layout;
