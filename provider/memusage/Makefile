libmemdiag.so: memdiag.o
	g++ -shared -o libmemdiag.so memdiag.o -ldl

memdiag.o: memdiag.cxx
	g++ -c -fPIC memdiag.cxx
